import bcrypt from 'bcryptjs';

// NOTE: The _id fields have been removed. MongoDB will generate them.
const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', 10),
    isAdmin: false,
  },
  {
    name: 'Jane Doe (Admin)',
    email: 'jane@example.com',
    password: bcrypt.hashSync('abcdef', 10),
    isAdmin: true,
  },
  {
    name: 'Test User',
    email: 'test@example.com',
    password: bcrypt.hashSync('password', 10),
    isAdmin: false,
  },
];

export default users;

