# ...existing code...
try:
    import pygame
    PYGAME_AVAILABLE = True
except Exception:
    pygame = None
    PYGAME_AVAILABLE = False

import random
import math

# ---------------- Config ----------------
WORLD_WIDTH, WORLD_HEIGHT = 1600, 900
DT_S = 0.05  # Smaller timestep for smoother simulation
NETWORK_RADIUS = 350.0
SAFE_DISTANCE = 250.0  # Much larger detection range
SENSOR_RANGE = 400.0  # Distance cars can sense obstacles ahead
ROAD_Y = WORLD_HEIGHT // 2
CAR_LENGTH = 40.0  # length of car in pixels

# Colors
COLOR_BG = (24, 28, 36)
COLOR_ROAD = (50, 55, 65)
COLOR_CAR = (90, 200, 255)
COLOR_AMBULANCE = (255, 100, 100)
COLOR_BLOCK = (180, 180, 180)
COLOR_TENTATIVE = (240, 200, 0)
COLOR_VERIFIED = (220, 40, 20)

# ---------------- Vehicle ----------------
class Vehicle:
    def __init__(self, x, y, speed, desired_speed, is_ambulance=False):
        self.x = float(x)
        self.y = float(y)
        self.speed = float(speed)
        self.desired_speed = float(desired_speed)
        self.base_desired_speed = float(desired_speed)
        self.accel_mps2 = 0.0
        self.is_ambulance = is_ambulance
        self.hazard_ahead = None
        self.target_speed = float(desired_speed)
        self.sensor_detected = False
        self.detected_hazard = None

        # Generate random car appearance
        if not is_ambulance:
            self.generate_car_style()
        else:
            self.body_color = COLOR_AMBULANCE
            self.stripe_type = None

    def generate_car_style(self):
        """Generate random car colors and patterns"""
        colors = [
            (255, 50, 50),    # Red
            (50, 100, 255),   # Blue
            (255, 220, 0),    # Yellow
            (50, 200, 50),    # Green
            (255, 100, 200),  # Pink
            (150, 50, 200),   # Purple
            (255, 140, 0),    # Orange
            (0, 200, 200),    # Cyan
            (240, 240, 240),  # White
            (40, 40, 40),     # Black
        ]
        self.body_color = random.choice(colors)
        stripe_types = [None, "racing", "horizontal", "number"]
        self.stripe_type = random.choice(stripe_types)
        if self.stripe_type == "number":
            self.number = random.randint(1, 99)

    def step(self, dt, hazards):
        # Smooth acceleration/deceleration with emergency braking capability
        delta = self.target_speed - self.speed
        max_accel = 2.5
        max_decel = 6.0  # Normal braking
        emergency_decel = 12.0  # Emergency braking when very close

        # Use emergency braking if we have a hazard very close
        if self.hazard_ahead:
            if hasattr(self.hazard_ahead, 'x'):
                dist = self.hazard_ahead.x - self.x
                if dist < 80:  # Emergency zone
                    max_decel = emergency_decel

        if delta > 0:
            self.accel_mps2 = min(max_accel, delta / dt)
        else:
            self.accel_mps2 = max(-max_decel, delta / dt)

        self.speed += self.accel_mps2 * dt
        self.speed = max(0.0, self.speed)

        # Store old position for potential collision handling
        old_x = self.x
        self.x += self.speed * dt

        # Wrap around world - spawn far enough left to have time to brake
        if self.x > WORLD_WIDTH + 50:
            self.x = -300.0
            self.speed = min(self.speed, 15.0)

# ---------------- Hazard ----------------
class Hazard:
    def __init__(self, hazard_type, x, y, width=20, height=120):
        self.hazard_type = hazard_type
        self.x = float(x)
        self.y = float(y)
        self.width = float(width)
        self.height = float(height)
        self.verified = False
        self.confirmers = 0

# ---------------- Simulation ----------------
class Simulation:
    def __init__(self, scenario="roadblock"):
        self.scenario = scenario
        self.vehicles = []
        self.hazards = []
        self.time_s = 0.0
        self.create_vehicles()

    def create_vehicles(self):
        lanes = [ROAD_Y - 60, ROAD_Y, ROAD_Y + 60]

        # Determine hazard position first if applicable
        hazard_x = None
        if self.scenario == "roadblock":
            hazard_x = WORLD_WIDTH // 2
            # Place roadblock in CENTER blocking ALL three lanes
            self.hazards.append(Hazard("ROADBLOCK", hazard_x, ROAD_Y, width=30, height=240))

        # Create regular vehicles with safe spacing from hazards and each other
        for i in range(15):
            lane = random.choice(lanes)
            x_pos = (i * 150) % WORLD_WIDTH

            # Don't spawn cars too close to the roadblock (within 500 pixels)
            if hazard_x is not None:
                safety_attempts = 0
                while abs(x_pos - hazard_x) < 500 and safety_attempts < 10:
                    x_pos = (x_pos + 200) % WORLD_WIDTH
                    safety_attempts += 1

            # Avoid overlapping existing vehicles in same lane
            max_attempts = 20
            attempts = 0
            while attempts < max_attempts:
                overlap = False
                for existing in self.vehicles:
                    if abs(existing.y - lane) < 30 and abs(existing.x - x_pos) < CAR_LENGTH + 20:
                        overlap = True
                        break
                if not overlap:
                    break
                x_pos = (x_pos + 100) % WORLD_WIDTH
                attempts += 1

            v = Vehicle(x=x_pos, y=lane,
                        speed=random.uniform(18, 23),
                        desired_speed=25.0)
            self.vehicles.append(v)

        if self.scenario == "ambulance":
            amb = Vehicle(x=-200, y=ROAD_Y, speed=20, desired_speed=35, is_ambulance=True)
            self.vehicles.append(amb)

    def get_distance_to_obstacle(self, vehicle):
        """Calculate distance to nearest obstacle ahead (car or hazard)"""
        min_distance = float('inf')
        obstacle = None
        obstacle_type = None

        # Check hazards - they block ALL lanes
        for h in self.hazards:
            direct_dist = h.x - vehicle.x - CAR_LENGTH / 2
            if h.x > vehicle.x and 0 < direct_dist < min_distance:
                min_distance = direct_dist
                obstacle = h
                obstacle_type = "hazard"

        # Check other vehicles - only in same lane
        for other in self.vehicles:
            if other is vehicle:
                continue
            if abs(other.y - vehicle.y) < 30:
                direct_dist = other.x - vehicle.x - CAR_LENGTH
                if other.x > vehicle.x and 0 < direct_dist < min_distance:
                    min_distance = direct_dist
                    obstacle = other
                    obstacle_type = "vehicle"

        return min_distance, obstacle, obstacle_type

    def step(self):
        # Sort vehicles by x position for better processing
        self.vehicles.sort(key=lambda v: v.x)

        # Update each vehicle
        for v in self.vehicles:
            dist_to_obstacle, obstacle, obstacle_type = self.get_distance_to_obstacle(v)

            # Update sensor detection status
            if dist_to_obstacle <= SENSOR_RANGE:
                v.sensor_detected = True
                v.detected_hazard = obstacle
            else:
                v.sensor_detected = False
                v.detected_hazard = None

            # Determine target speed based on distance to obstacle with emergency braking
            if dist_to_obstacle < 30:
                # CRITICAL: Emergency stop zone - immediate halt
                v.target_speed = 0.0
                v.hazard_ahead = obstacle
                v.speed = max(0.0, v.speed - 15.0 * DT_S)
            elif dist_to_obstacle < 80:
                # Very close - aggressive braking
                v.target_speed = 0.0
                v.hazard_ahead = obstacle
            elif dist_to_obstacle < SAFE_DISTANCE:
                # Slow down proportionally to distance
                ratio = max(0.01, dist_to_obstacle / SAFE_DISTANCE)
                v.target_speed = v.base_desired_speed * ratio * 0.4
                v.hazard_ahead = obstacle
            elif dist_to_obstacle < SAFE_DISTANCE * 2:
                # Gradually return to desired speed
                ratio = (dist_to_obstacle - SAFE_DISTANCE) / SAFE_DISTANCE
                v.target_speed = v.base_desired_speed * (0.5 + 0.5 * ratio)
                v.hazard_ahead = obstacle
            else:
                # Clear road, go to desired speed
                v.target_speed = v.base_desired_speed
                v.hazard_ahead = None

            v.step(DT_S, self.hazards)

        # Collision detection and resolution (prevent overlap)
        for i, v1 in enumerate(self.vehicles):
            for v2 in self.vehicles[i+1:]:
                if abs(v1.y - v2.y) < 30:
                    distance = abs(v1.x - v2.x)
                    min_distance = CAR_LENGTH + 5  # Minimum safe distance
                    if distance < min_distance:
                        overlap = min_distance - distance
                        if v1.x > v2.x:
                            v1.x += overlap / 2
                            v2.x -= overlap / 2
                            v2.speed = min(v2.speed, v1.speed * 0.9)
                        else:
                            v2.x += overlap / 2
                            v1.x -= overlap / 2
                            v1.speed = min(v1.speed, v2.speed * 0.9)

        self.time_s += DT_S

# ---------------- Visualization ----------------
class Visual:
    def __init__(self, sim, fps=30):
        if not PYGAME_AVAILABLE:
            raise RuntimeError("pygame is not available")
        pygame.init()
        self.screen = pygame.display.set_mode((WORLD_WIDTH, WORLD_HEIGHT))
        pygame.display.set_caption("V2V Hazard Simulator")
        self.clock = pygame.time.Clock()
        self.sim = sim
        self.font = pygame.font.SysFont("Arial", 18)
        self.fps = fps

    def draw(self):
        self.screen.fill(COLOR_BG)

        # Draw road with lane markers
        pygame.draw.rect(self.screen, COLOR_ROAD, (0, ROAD_Y - 120, WORLD_WIDTH, 240))

        # Lane dividers
        for y_offset in [-60, 60]:
            for x in range(0, WORLD_WIDTH, 40):
                pygame.draw.line(self.screen, (80, 80, 80),
                                 (x, ROAD_Y + y_offset),
                                 (x + 20, ROAD_Y + y_offset), 2)

        # Draw roadblocks
        for h in self.sim.hazards:
            rx = int(h.x - h.width / 2)
            ry = int(h.y - h.height / 2)
            rw = int(h.width)
            rh = int(h.height)
            pygame.draw.rect(self.screen, COLOR_BLOCK, (rx, ry, rw, rh))
            for i in range(0, rh, 20):
                color = (255, 200, 0) if i % 40 == 0 else (50, 50, 50)
                pygame.draw.rect(self.screen, color, (rx, ry + i, rw, 10))

        # Draw vehicles
        for v in self.sim.vehicles:
            car_x = int(v.x - CAR_LENGTH / 2)
            car_y = int(v.y - 10)
            car_w = int(CAR_LENGTH)
            car_h = 20

            pygame.draw.rect(self.screen, v.body_color, (car_x, car_y, car_w, car_h))
            pygame.draw.rect(self.screen, (0, 0, 0), (car_x, car_y, car_w, car_h), 2)

            if getattr(v, 'stripe_type', None) == "racing":
                stripe_color = (255, 255, 255)
                pygame.draw.rect(self.screen, stripe_color, (car_x + car_w // 2 - 3, car_y, 6, car_h))
            elif getattr(v, 'stripe_type', None) == "horizontal":
                stripe_color = (255, 255, 255) if sum(v.body_color) < 400 else (0, 0, 0)
                for i in range(3):
                    y_pos = car_y + (i * car_h // 3) + 2
                    pygame.draw.line(self.screen, stripe_color, (car_x + 5, y_pos), (car_x + car_w - 5, y_pos), 2)
            elif getattr(v, 'stripe_type', None) == "number":
                number_bg = (255, 255, 255) if sum(v.body_color) < 400 else (0, 0, 0)
                number_text_color = (0, 0, 0) if sum(v.body_color) < 400 else (255, 255, 255)
                pygame.draw.ellipse(self.screen, number_bg, (car_x + car_w // 2 - 8, car_y + 2, 16, 16))
                num_font = pygame.font.SysFont("Arial", 12, bold=True)
                num_text = num_font.render(str(v.number), True, number_text_color)
                num_rect = num_text.get_rect(center=(car_x + car_w // 2, car_y + 10))
                self.screen.blit(num_text, num_rect)

            # Windows
            window_color = (30, 30, 50)
            pygame.draw.rect(self.screen, window_color, (car_x + car_w - 12, car_y + 3, 8, 14))
            pygame.draw.rect(self.screen, window_color, (car_x + 4, car_y + 3, 8, 14))

            # Headlights
            light_color = (255, 255, 200)
            pygame.draw.circle(self.screen, light_color, (car_x + car_w - 2, car_y + 5), 2)
            pygame.draw.circle(self.screen, light_color, (car_x + car_w - 2, car_y + 15), 2)

            # Speed indicator
            speed_text = self.font.render(f"{v.speed:.0f}", True, (255, 255, 255))
            self.screen.blit(speed_text, (int(v.x - 10), int(v.y - 30)))

            # Sensor indicator
            if v.sensor_detected and v.detected_hazard:
                sensor_color = (100, 200, 200)
                pygame.draw.circle(self.screen, sensor_color, (car_x + car_w - 5, car_y + car_h // 2), 3)

            # Braking indicator
            if v.hazard_ahead:
                pygame.draw.line(self.screen, (180, 50, 50),
                                 (int(v.x), int(v.y)),
                                 (int(v.x + SAFE_DISTANCE * 0.5), int(v.y)), 1)
                brake_color = (255, 0, 0)
                pygame.draw.circle(self.screen, brake_color, (car_x + 2, car_y + 5), 3)
                pygame.draw.circle(self.screen, brake_color, (car_x + 2, car_y + 15), 3)

        # HUD
        txt = self.font.render(f"Scenario: {self.sim.scenario}  Time: {self.sim.time_s:.1f}s  Vehicles: {len(self.sim.vehicles)}",
                               True, (220, 230, 245))
        self.screen.blit(txt, (10, 10))
        instructions = self.font.render("Cyan dot = Sensor Active | Red lights = Braking | Cars stop before roadblocks",
                                       True, (180, 180, 180))
        self.screen.blit(instructions, (10, WORLD_HEIGHT - 30))

    def loop(self, duration_s=60):
        end_t = self.sim.time_s + duration_s
        running = True
        while running and self.sim.time_s < end_t:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False

            self.sim.step()
            self.draw()
            pygame.display.flip()
            self.clock.tick(self.fps)

        pygame.quit()

# ---------------- Run ----------------
if __name__ == "__main__":
    if not PYGAME_AVAILABLE:
        print("Error: pygame is not installed. Install it with: pip install pygame")
    else:
        sim = Simulation(scenario="roadblock")  # change to "ambulance" to test that
        vis = Visual(sim)
        vis.loop(duration_s=60)
# ...existing code...