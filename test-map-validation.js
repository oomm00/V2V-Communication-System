/**
 * Automated Map Component Validation Script
 * This script validates the map component implementation against requirements
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

class MapComponentValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    logTest(name, passed, details = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const color = passed ? 'green' : 'red';
        this.log(`${status} - ${name}`, color);
        if (details) {
            this.log(`   ${details}`, 'cyan');
        }
        
        this.results.tests.push({ name, passed, details });
        if (passed) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }
    }

    logWarning(message) {
        this.log(`⚠️  WARNING - ${message}`, 'yellow');
        this.results.warnings++;
    }

    logSection(title) {
        this.log(`\n${'='.repeat(60)}`, 'bold');
        this.log(`${title}`, 'bold');
        this.log(`${'='.repeat(60)}`, 'bold');
    }

    // Test 1: Check if required dependencies are installed
    testDependencies() {
        this.logSection('1. Dependency Validation');
        
        try {
            const packageJson = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'frontend', 'package.json'), 'utf8')
            );
            
            const requiredDeps = {
                'leaflet': '^1.9.4',
                'react-leaflet': '^4.2.1'
            };
            
            let allInstalled = true;
            for (const [dep, version] of Object.entries(requiredDeps)) {
                if (packageJson.dependencies[dep]) {
                    this.logTest(
                        `Dependency ${dep} installed`,
                        true,
                        `Version: ${packageJson.dependencies[dep]}`
                    );
                } else {
                    this.logTest(`Dependency ${dep} installed`, false, 'Not found in package.json');
                    allInstalled = false;
                }
            }
            
            return allInstalled;
        } catch (error) {
            this.logTest('Read package.json', false, error.message);
            return false;
        }
    }

    // Test 2: Check if MapComponent file exists and has correct structure
    testMapComponentStructure() {
        this.logSection('2. MapComponent Structure Validation');
        
        try {
            const mapComponentPath = path.join(__dirname, 'frontend', 'src', 'components', 'MapComponent.jsx');
            const content = fs.readFileSync(mapComponentPath, 'utf8');
            
            // Check for required imports
            const requiredImports = [
                { name: 'React', pattern: /import\s+React/i },
                { name: 'MapContainer', pattern: /MapContainer/ },
                { name: 'TileLayer', pattern: /TileLayer/ },
                { name: 'Marker', pattern: /Marker/ },
                { name: 'Popup', pattern: /Popup/ },
                { name: 'Leaflet CSS', pattern: /import\s+['"]leaflet\/dist\/leaflet\.css['"]/ }
            ];
            
            requiredImports.forEach(({ name, pattern }) => {
                this.logTest(
                    `Import ${name}`,
                    pattern.test(content),
                    pattern.test(content) ? 'Found' : 'Missing'
                );
            });
            
            // Check for props interface
            this.logTest(
                'Component accepts alerts prop',
                /alerts\s*[=:]/i.test(content),
                'Props destructuring found'
            );
            
            // Check for React.memo optimization
            this.logTest(
                'Component wrapped with React.memo',
                /React\.memo/i.test(content),
                'Performance optimization applied'
            );
            
            // Check for error handling
            this.logTest(
                'Error handling for invalid data',
                /console\.(warn|error)/i.test(content),
                'Console warnings/errors present'
            );
            
            return true;
        } catch (error) {
            this.logTest('Read MapComponent.jsx', false, error.message);
            return false;
        }
    }

    // Test 3: Check mapUtils implementation
    testMapUtils() {
        this.logSection('3. Map Utilities Validation');
        
        try {
            const mapUtilsPath = path.join(__dirname, 'frontend', 'src', 'utils', 'mapUtils.js');
            const content = fs.readFileSync(mapUtilsPath, 'utf8');
            
            // Check for getMarkerIcon function
            this.logTest(
                'getMarkerIcon function exists',
                /export\s+(const|function)\s+getMarkerIcon/i.test(content),
                'Icon generation function found'
            );
            
            // Check for color mapping
            const colorTests = [
                { type: 'accident', color: '#ef4444', name: 'red' },
                { type: 'ice', color: '#3b82f6', name: 'blue' },
                { type: 'debris', color: '#f59e0b', name: 'amber' },
                { type: 'default', color: '#6b7280', name: 'gray' }
            ];
            
            colorTests.forEach(({ type, color, name }) => {
                this.logTest(
                    `Color mapping for ${type}`,
                    content.includes(color),
                    `${name} (${color})`
                );
            });
            
            // Check for validateCoordinates function
            this.logTest(
                'validateCoordinates function exists',
                /export\s+(const|function)\s+validateCoordinates/i.test(content),
                'Coordinate validation function found'
            );
            
            // Check for coordinate range validation
            this.logTest(
                'Latitude range validation (-90 to 90)',
                /-90.*90/.test(content) || /latitude.*-90.*90/.test(content),
                'Range check implemented'
            );
            
            this.logTest(
                'Longitude range validation (-180 to 180)',
                /-180.*180/.test(content) || /longitude.*-180.*180/.test(content),
                'Range check implemented'
            );
            
            return true;
        } catch (error) {
            this.logTest('Read mapUtils.js', false, error.message);
            return false;
        }
    }

    // Test 4: Check Dashboard integration
    testDashboardIntegration() {
        this.logSection('4. Dashboard Integration Validation');
        
        try {
            const dashboardPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Dashboard.jsx');
            const content = fs.readFileSync(dashboardPath, 'utf8');
            
            // Check for MapComponent import
            this.logTest(
                'MapComponent imported in Dashboard',
                /import.*MapComponent.*from/i.test(content),
                'Import statement found'
            );
            
            // Check for Leaflet CSS import
            this.logTest(
                'Leaflet CSS imported',
                /import\s+['"]leaflet\/dist\/leaflet\.css['"]/.test(content),
                'CSS import found'
            );
            
            // Check for MapComponent usage
            this.logTest(
                'MapComponent rendered in Dashboard',
                /<MapComponent/i.test(content),
                'Component usage found'
            );
            
            // Check for alerts prop passed to MapComponent
            this.logTest(
                'Alerts data passed to MapComponent',
                /<MapComponent[^>]*alerts\s*=\s*\{alerts\}/i.test(content),
                'Props binding found'
            );
            
            // Check for error boundary
            this.logTest(
                'Error boundary implemented',
                /ErrorBoundary/i.test(content) || /componentDidCatch/i.test(content),
                'Error handling wrapper found'
            );
            
            // Check for error state handling
            this.logTest(
                'Map error state handling',
                /mapError/i.test(content),
                'Error state management found'
            );
            
            return true;
        } catch (error) {
            this.logTest('Read Dashboard.jsx', false, error.message);
            return false;
        }
    }

    // Test 5: Check responsive styling
    testResponsiveDesign() {
        this.logSection('5. Responsive Design Validation');
        
        try {
            const mapComponentPath = path.join(__dirname, 'frontend', 'src', 'components', 'MapComponent.jsx');
            const content = fs.readFileSync(mapComponentPath, 'utf8');
            
            // Check for responsive height classes
            const responsivePatterns = [
                { name: 'Mobile height (h-[300px])', pattern: /h-\[300px\]|h-300/ },
                { name: 'Tablet height (md:h-[400px])', pattern: /md:h-\[400px\]|md:h-400/ },
                { name: 'Desktop height (lg:h-[500px])', pattern: /lg:h-\[500px\]|lg:h-500/ }
            ];
            
            responsivePatterns.forEach(({ name, pattern }) => {
                this.logTest(
                    name,
                    pattern.test(content),
                    pattern.test(content) ? 'Responsive class found' : 'Not found'
                );
            });
            
            // Check for full width
            this.logTest(
                'Full width styling (w-full)',
                /w-full/.test(content),
                'Width class found'
            );
            
            return true;
        } catch (error) {
            this.logTest('Check responsive design', false, error.message);
            return false;
        }
    }

    // Test 6: Validate popup content structure
    testPopupContent() {
        this.logSection('6. Popup Content Validation');
        
        try {
            const mapComponentPath = path.join(__dirname, 'frontend', 'src', 'components', 'MapComponent.jsx');
            const content = fs.readFileSync(mapComponentPath, 'utf8');
            
            // Check for Popup component
            this.logTest(
                'Popup component used',
                /<Popup>/i.test(content),
                'Popup wrapper found'
            );
            
            // Check for required popup fields
            const popupFields = [
                { name: 'Hazard type', pattern: /hazard_type/i },
                { name: 'Coordinates (latitude)', pattern: /latitude/i },
                { name: 'Coordinates (longitude)', pattern: /longitude/i },
                { name: 'Confidence level', pattern: /confidence/i },
                { name: 'Timestamp', pattern: /verified_at|timestamp/i }
            ];
            
            popupFields.forEach(({ name, pattern }) => {
                this.logTest(
                    `Popup displays ${name}`,
                    pattern.test(content),
                    'Field reference found'
                );
            });
            
            // Check for coordinate formatting (toFixed)
            this.logTest(
                'Coordinates formatted to 4 decimals',
                /toFixed\(4\)/.test(content),
                'Formatting function found'
            );
            
            // Check for confidence percentage conversion
            this.logTest(
                'Confidence displayed as percentage',
                /confidence.*100|100.*confidence/.test(content),
                'Percentage conversion found'
            );
            
            return true;
        } catch (error) {
            this.logTest('Check popup content', false, error.message);
            return false;
        }
    }

    // Test 7: Check data validation and filtering
    testDataValidation() {
        this.logSection('7. Data Validation and Filtering');
        
        try {
            const mapComponentPath = path.join(__dirname, 'frontend', 'src', 'components', 'MapComponent.jsx');
            const content = fs.readFileSync(mapComponentPath, 'utf8');
            
            // Check for array validation
            this.logTest(
                'Alerts array validation',
                /Array\.isArray\(alerts\)/.test(content),
                'Array type check found'
            );
            
            // Check for filtering invalid coordinates
            this.logTest(
                'Filter alerts with invalid coordinates',
                /filter.*validateCoordinates|validateCoordinates.*filter/.test(content),
                'Filtering logic found'
            );
            
            // Check for empty array handling
            this.logTest(
                'Empty alerts array handling',
                /alerts\.length.*===.*0|alerts\.length.*<.*1/.test(content),
                'Empty check found'
            );
            
            // Check for optional chaining for missing properties
            this.logTest(
                'Optional chaining for safety',
                /\?\./g.test(content),
                'Optional chaining operators found'
            );
            
            return true;
        } catch (error) {
            this.logTest('Check data validation', false, error.message);
            return false;
        }
    }

    // Generate summary report
    generateSummary() {
        this.logSection('Test Summary');
        
        const total = this.results.passed + this.results.failed;
        const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
        
        this.log(`\nTotal Tests: ${total}`, 'bold');
        this.log(`Passed: ${this.results.passed}`, 'green');
        this.log(`Failed: ${this.results.failed}`, 'red');
        this.log(`Warnings: ${this.results.warnings}`, 'yellow');
        this.log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
        
        if (this.results.failed === 0) {
            this.log('\n🎉 All tests passed! Map component implementation is complete.', 'green');
        } else {
            this.log('\n⚠️  Some tests failed. Please review the implementation.', 'red');
        }
        
        // Save results to file
        const reportPath = path.join(__dirname, 'map-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                total,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                successRate: `${successRate}%`
            },
            tests: this.results.tests
        }, null, 2));
        
        this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
    }

    // Run all tests
    async runAll() {
        this.log('\n🗺️  Map Component Validation Suite', 'bold');
        this.log('Testing implementation against requirements...\n', 'cyan');
        
        this.testDependencies();
        this.testMapComponentStructure();
        this.testMapUtils();
        this.testDashboardIntegration();
        this.testResponsiveDesign();
        this.testPopupContent();
        this.testDataValidation();
        
        this.generateSummary();
        
        return this.results.failed === 0;
    }
}

// Run validation
const validator = new MapComponentValidator();
validator.runAll().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
});
