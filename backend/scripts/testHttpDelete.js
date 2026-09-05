require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testHttpDelete() {
  const token = jwt.sign({ id: 1, email: 'admin@psicolau.com' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  
  const PORT = process.env.PORT || 3001;
  const res = await fetch(`http://localhost:${PORT}/api/pacientes/4`, {
    method: 'DELETE',
    headers: {

      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

testHttpDelete().catch(console.error);
