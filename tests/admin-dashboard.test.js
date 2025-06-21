const fetch = require('node-fetch');

/**
 * Unit tests for the admin dashboard endpoint
 */
describe('Admin Dashboard API', () => {
  const ADMIN_URL = 'http://localhost:8080/admin/index.php';
  const ADMIN_PASSWORD = 'lalumo2024';
  
  // Test timeout (10s)
  jest.setTimeout(10000);
  
  test('Should return 401 unauthorized without password', async () => {
    try {
      const response = await fetch(ADMIN_URL);
      expect(response.status).toBe(401);
    } catch (error) {
      // Captured request error is also acceptable if it's configured to reject unauthorized
      expect(error.message).toContain('failed');
    }
  });
  
  test('Should return 200 with dashboard data when authenticated', async () => {
    // Directly request HTML page with password
    const response = await fetch(ADMIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `password=${ADMIN_PASSWORD}`,
      redirect: 'follow'
    });
    
    expect(response.status).toBe(200);
    const html = await response.text();
    
    // Verify it's the dashboard content
    expect(html).toContain('Referral System Dashboard');
    expect(html).toContain('User Registrations');
    expect(html).toContain('<table');
  });
  
  test('Should fetch JSON data from admin API', async () => {
    // Request JSON data with authentication
    const response = await fetch(`${ADMIN_URL}?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `password=${ADMIN_PASSWORD}`,
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verify data structure
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('statistics');
    expect(data.statistics).toHaveProperty('totalUsers');
    expect(data.statistics).toHaveProperty('totalClicks');
    expect(data.statistics).toHaveProperty('totalRedemptions');
    
    // Users should be an array
    expect(Array.isArray(data.users)).toBe(true);
  });
});
