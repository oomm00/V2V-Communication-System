# ...existing code...
try:
    import pygame
    PYGAME_AVAILABLE = True
except Exception:
    pygame = None
    PYGAME_AVAILABLE = False

import random

# ---------------- CONFIG ----------------
WORLD_WIDTH, WORLD_HEIGHT = 1400, 800
ROAD_Y = WORLD_HEIGHT // 2
LANES = [ROAD_Y - 60, ROAD_Y, ROAD_Y + 60]
CAR_LENGTH = 45
CAR_WIDTH = 22
SAFE_DISTANCE = 140
SENSOR_RANGE = 300
DT = 0.05

# COLORS
COLOR_BG = (25, 28, 33)
COLOR_ROAD = (60, 65, 75)
COLOR_ACCIDENT = (220, 60, 60)
COLOR_BLOCK = (180, 180, 180)
COLOR_SENSOR = (100, 200, 200)

# ---------------- CLASSES ----------------
class Vehicle:
    def __init__(self, x, y, speed):
        self.x, self.y = float(x), float(y)
        self.speed = float(speed)
        self.target_speed = float(speed)
        self.color = random.choice([(255, 80, 80), (80, 200, 255), (255, 200, 0), (80, 255, 100)])
        self.lane = y
        self.switching = False
        self.sensor_on = False
        # random stripe style like simulation.py
        stripe_types = [None, "racing", "horizontal", "number"]
        self.stripe_type = random.choice(stripe_types)
        if self.stripe_type == "number":
            self.number = random.randint(1, 99)
        self.hazard_ahead = None

    def step(self):
        # Smooth speed change towards target_speed
        if abs(self.speed - self.target_speed) > 0.5:
            self.speed += (self.target_speed - self.speed) * 0.2
        else:
            # small corrections
            self.speed += (self.target_speed - self.speed) * 0.05
        self.speed = max(0.0, self.speed)
        self.x += self.speed * DT

# simple hazard (accident) object
class Hazard:
    def __init__(self, x, y):
        self.x, self.y = float(x), float(y)
        self.width = 50
        self.height = 30

# ---------------- SIMULATION ----------------
class Simulation:
    def __init__(self):
        self.vehicles = []
        self.hazard = Hazard(WORLD_WIDTH // 2, ROAD_Y)
        self.make_traffic()
        self.time_s = 0.0

    def make_traffic(self):
        for i in range(15):
            lane = random.choice(LANES)
            x = random.randint(0, WORLD_WIDTH)
            # avoid spawning too close to hazard
            if abs(x - self.hazard.x) < 200:
                x = (x + 300) % WORLD_WIDTH
            self.vehicles.append(Vehicle(x, lane, random.uniform(18, 30)))

    def get_front_vehicle(self, v):
        nearest, dist = None, 1e9
        for o in self.vehicles:
            if o is v:
                continue
            if abs(o.y - v.y) < 25 and o.x > v.x:
                d = o.x - v.x
                if d < dist:
                    dist = d
                    nearest = o
        return nearest, dist

    def step(self):
        for v in self.vehicles:
            dist_to_acc = self.hazard.x - v.x
            same_lane = abs(v.y - self.hazard.y) < 30
            v.sensor_on = same_lane and 0 < dist_to_acc < SENSOR_RANGE

            front, dist_front = self.get_front_vehicle(v)

            if same_lane and 0 < dist_to_acc < SENSOR_RANGE:
                # try lane switch
                switched = False
                for offset in (-60, 60):
                    new_lane = v.lane + offset
                    if new_lane in LANES and self.is_lane_clear(new_lane, v.x):
                        v.y = new_lane
                        v.lane = new_lane
                        v.switching = True
                        switched = True
                        break
                if not switched:
                    if dist_to_acc < SAFE_DISTANCE:
                        v.target_speed = 0
                        v.hazard_ahead = self.hazard
                    else:
                        v.target_speed = 15
                        v.hazard_ahead = None
            else:
                v.switching = False
                if front and dist_front < SAFE_DISTANCE:
                    v.target_speed = 0
                    v.hazard_ahead = front
                else:
                    v.target_speed = 25
                    v.hazard_ahead = None

            v.step()

        # wrap-around
        for v in self.vehicles:
            if v.x > WORLD_WIDTH + 50:
                v.x = -300
                v.speed = random.uniform(20, 30)

        # simple collision prevention (separate overlapping cars same lane)
        self.vehicles.sort(key=lambda vv: vv.x)
        for i, v1 in enumerate(self.vehicles):
            for v2 in self.vehicles[i+1:]:
                if abs(v1.y - v2.y) < 25:
                    dist = v2.x - v1.x
                    min_dist = CAR_LENGTH + 5
                    if 0 < dist < min_dist:
                        shift = (min_dist - dist) / 2
                        v1.x -= shift
                        v2.x += shift
                        # slow the rear car
                        if v1.x < v2.x:
                            v1.speed = min(v1.speed, v2.speed * 0.9)

        self.time_s += DT

    def is_lane_clear(self, y_target, x_pos):
        for o in self.vehicles:
            if abs(o.y - y_target) < 25 and abs(o.x - x_pos) < 100:
                return False
        return True

# ---------------- VISUAL (match simulation.py visuals + speed counter) ----------------
class Visual:
    def __init__(self, sim):
        if not PYGAME_AVAILABLE:
            raise RuntimeError("pygame is not installed")
        pygame.init()
        self.sim = sim
        self.screen = pygame.display.set_mode((WORLD_WIDTH, WORLD_HEIGHT))
        pygame.display.set_caption("Accident Scenario")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 18)
        self.small_font = pygame.font.SysFont("Arial", 12)
        self.fps = 30

    def draw(self):
        s = self.screen
        s.fill(COLOR_BG)
        pygame.draw.rect(s, COLOR_ROAD, (0, ROAD_Y - 120, WORLD_WIDTH, 240))

        # lanes
        for y in LANES:
            for x in range(0, WORLD_WIDTH, 50):
                pygame.draw.line(s, (90, 90, 90), (x, y), (x + 25, y), 2)

        # draw accident (hazard) with cross and warning stripes like simulation
        h = self.sim.hazard
        rx = int(h.x - h.width / 2)
        ry = int(h.y - h.height / 2)
        pygame.draw.rect(s, COLOR_ACCIDENT, (h.x - 25, h.y - 15, 50, 30))
        pygame.draw.line(s, (255, 255, 255), (h.x - 20, h.y - 10), (h.x + 20, h.y + 10), 3)
        pygame.draw.line(s, (255, 255, 255), (h.x - 20, h.y + 10), (h.x + 20, h.y - 10), 3)

        # draw vehicles with stripes, speed counter, sensor and brake lights
        for v in self.sim.vehicles:
            car_x = int(v.x - CAR_LENGTH / 2)
            car_y = int(v.y - 10)
            car_w = int(CAR_LENGTH)
            car_h = 20

            # body + outline
            pygame.draw.rect(s, v.color, (car_x, car_y, car_w, car_h))
            pygame.draw.rect(s, (0, 0, 0), (car_x, car_y, car_w, car_h), 2)

            # stripes/patterns
            if getattr(v, "stripe_type", None) == "racing":
                pygame.draw.rect(s, (255, 255, 255), (car_x + car_w // 2 - 3, car_y, 6, car_h))
            elif getattr(v, "stripe_type", None) == "horizontal":
                stripe_color = (255, 255, 255) if sum(v.color) < 400 else (0, 0, 0)
                for i in range(3):
                    y_pos = car_y + (i * car_h // 3) + 2
                    pygame.draw.line(s, stripe_color, (car_x + 5, y_pos), (car_x + car_w - 5, y_pos), 2)
            elif getattr(v, "stripe_type", None) == "number":
                bg = (255, 255, 255) if sum(v.color) < 400 else (0, 0, 0)
                fg = (0, 0, 0) if sum(v.color) < 400 else (255, 255, 255)
                pygame.draw.ellipse(s, bg, (car_x + car_w // 2 - 8, car_y + 2, 16, 16))
                num_text = self.small_font.render(str(v.number), True, fg)
                s.blit(num_text, num_text.get_rect(center=(car_x + car_w // 2, car_y + 10)))

            # windows
            window_color = (30, 30, 50)
            pygame.draw.rect(s, window_color, (car_x + car_w - 12, car_y + 3, 8, 14))
            pygame.draw.rect(s, window_color, (car_x + 4, car_y + 3, 8, 14))

            # headlights
            light_color = (255, 255, 200)
            pygame.draw.circle(s, light_color, (car_x + car_w - 2, car_y + 5), 2)
            pygame.draw.circle(s, light_color, (car_x + car_w - 2, car_y + 15), 2)

            # speed counter above car
            speed_text = self.font.render(f"{v.speed:.0f}", True, (255, 255, 255))
            s.blit(speed_text, (int(v.x - 12), int(v.y - 30)))

            # sensor indicator (cyan dot) if detecting hazard
            if v.sensor_on:
                pygame.draw.circle(s, COLOR_SENSOR, (int(car_x + car_w - 5), int(car_y + car_h // 2)), 3)

            # brake lights if stopped/target_speed==0 or hazard ahead
            if v.target_speed == 0 or getattr(v, "hazard_ahead", None):
                brake_color = (255, 0, 0)
                pygame.draw.circle(s, brake_color, (car_x + 2, car_y + 5), 3)
                pygame.draw.circle(s, brake_color, (car_x + 2, car_y + 15), 3)

        # HUD
        txt = self.font.render(f"Accident scenario  Time: {self.sim.time_s:.1f}s  Vehicles: {len(self.sim.vehicles)}", True, (230, 230, 240))
        s.blit(txt, (10, 10))
        instructions = self.font.render("Cyan dot = Sensor Active | Red = Stopped/Braking | Number = speed (km/h)", True, (180, 180, 180))
        s.blit(instructions, (10, WORLD_HEIGHT - 30))

        pygame.display.flip()

    def loop(self):
        running = True
        while running:
            for e in pygame.event.get():
                if e.type == pygame.QUIT:
                    running = False
            self.sim.step()
            self.draw()
            self.clock.tick(self.fps)
        pygame.quit()

# ---------------- RUN ----------------
if __name__ == "__main__":
    if not PYGAME_AVAILABLE:
        print("Error: pygame is not installed. Install with: pip install pygame")
    else:
        sim = Simulation()
        vis = Visual(sim)
        vis.loop()