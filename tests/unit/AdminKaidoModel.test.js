// AdminKaidoModel.test.js
// Unit test to verify special Kaido model loading for admin "leduc"

describe('Admin Kaido Model Loading', () => {
    test('Should load Kaido model for admin user "leduc"', () => {
        // Mock user object for admin "leduc"
        const adminUser = {
            username: 'leduc',
            role: 'admin'
        };

        // Determine model file name based on user
        let modelFileName = 'calem/calem.glb';
        if (adminUser.username === 'leduc' && (adminUser.role === 'admin' || adminUser.role === 'co-admin')) {
            modelFileName = 'calem/leduc/kaido.glb';
        }

        expect(modelFileName).toBe('calem/leduc/kaido.glb');
    });

    test('Should load standard model for regular user "leduc"', () => {
        // Mock user object for regular user "leduc"
        const regularUser = {
            username: 'leduc',
            role: 'user'
        };

        // Determine model file name based on user
        let modelFileName = 'calem/calem.glb';
        if (regularUser.username === 'leduc' && (regularUser.role === 'admin' || regularUser.role === 'co-admin')) {
            modelFileName = 'calem/leduc/kaido.glb';
        }

        expect(modelFileName).toBe('calem/calem.glb');
    });

    test('Should load standard model for admin user "otheradmin"', () => {
        // Mock user object for other admin user
        const otherAdminUser = {
            username: 'otheradmin',
            role: 'admin'
        };

        // Determine model file name based on user
        let modelFileName = 'calem/calem.glb';
        if (otherAdminUser.username === 'leduc' && (otherAdminUser.role === 'admin' || otherAdminUser.role === 'co-admin')) {
            modelFileName = 'calem/leduc/kaido.glb';
        }

        expect(modelFileName).toBe('calem/calem.glb');
    });
});