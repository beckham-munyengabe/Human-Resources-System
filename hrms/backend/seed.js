require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Department = require('./models/Department');
const Employee = require('./models/Employee');

const seed = async () => {
  try {

    await connectDB();

    console.log('🌱 Starting seed...');

    // CLEAR DATABASE
    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Employee.deleteMany()
    ]);

    console.log('🗑️ Cleared existing data');


    // CREATE DEPARTMENTS
    const depts = await Department.insertMany([
      {
        name: 'Administration',
        description: 'Company administration and executive management',
        employeeCount: 0
      },

      {
        name: 'Finance',
        description: 'Financial planning, accounting, and budget management',
        employeeCount: 0
      },

      {
        name: 'Information Technology',
        description: 'Software development and IT infrastructure',
        employeeCount: 0
      },

      {
        name: 'Marketing',
        description: 'Brand management, campaigns, and customer engagement',
        employeeCount: 0
      },

      {
        name: 'Human Resources',
        description: 'Talent acquisition, employee relations, and HR operations',
        employeeCount: 0
      }
    ]);

    console.log(`✅ Created ${depts.length} departments`);


    // DEPARTMENT MAP
    const deptMap = {};

    depts.forEach((dept) => {
      deptMap[dept.name] = dept._id;
    });


    // ADMIN USER
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@hrms.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created');


    // HR EMPLOYEE
    const hrEmp = await Employee.create({
      fullName: 'Sarah Johnson',
      gender: 'Female',
      dateOfBirth: new Date('1988-03-15'),

      email: 'hr@hrms.com',
      phoneNumber: '+1-555-0102',

      address: {
        street: '456 HR Ave',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },

      position: 'HR Manager',

      department: deptMap['Human Resources'],

      basicSalary: 7500,

      joiningDate: new Date('2020-01-10'),

      status: 'active'
    });


    // HR USER
    const hrUser = await User.create({
      fullName: 'Sarah Johnson',
      email: 'hr@hrms.com',
      password: 'Admin@123',
      role: 'hr_manager',
      employee: hrEmp._id,
      isActive: true
    });

    hrEmp.user = hrUser._id;

    await hrEmp.save();

    await Department.findByIdAndUpdate(
      deptMap['Human Resources'],
      {
        $inc: {
          employeeCount: 1
        }
      }
    );

    console.log('✅ HR Manager created');


    // SAMPLE EMPLOYEES
    const sampleEmployees = [

      {
        fullName: 'James Wilson',
        gender: 'Male',
        dateOfBirth: '1990-06-20',
        email: 'james.wilson@hrms.com',
        phoneNumber: '+1-555-0103',
        position: 'Financial Analyst',
        department: 'Finance',
        basicSalary: 6000
      },

      {
        fullName: 'Emily Chen',
        gender: 'Female',
        dateOfBirth: '1993-11-05',
        email: 'emily.chen@hrms.com',
        phoneNumber: '+1-555-0104',
        position: 'Software Engineer',
        department: 'Information Technology',
        basicSalary: 8000
      },

      {
        fullName: 'Michael Brown',
        gender: 'Male',
        dateOfBirth: '1985-02-14',
        email: 'michael.brown@hrms.com',
        phoneNumber: '+1-555-0105',
        position: 'Marketing Manager',
        department: 'Marketing',
        basicSalary: 7000
      },

      {
        fullName: 'Aisha Patel',
        gender: 'Female',
        dateOfBirth: '1995-08-30',
        email: 'aisha.patel@hrms.com',
        phoneNumber: '+1-555-0106',
        position: 'Frontend Developer',
        department: 'Information Technology',
        basicSalary: 7200
      },

      {
        fullName: 'Robert Davis',
        gender: 'Male',
        dateOfBirth: '1987-04-22',
        email: 'robert.davis@hrms.com',
        phoneNumber: '+1-555-0107',
        position: 'Accountant',
        department: 'Finance',
        basicSalary: 5500
      },

      {
        fullName: 'Linda Martinez',
        gender: 'Female',
        dateOfBirth: '1991-12-18',
        email: 'linda.martinez@hrms.com',
        phoneNumber: '+1-555-0108',
        position: 'Marketing Specialist',
        department: 'Marketing',
        basicSalary: 5000
      },

      {
        fullName: 'David Thompson',
        gender: 'Male',
        dateOfBirth: '1984-09-10',
        email: 'david.thompson@hrms.com',
        phoneNumber: '+1-555-0109',
        position: 'Systems Administrator',
        department: 'Information Technology',
        basicSalary: 6500
      },

      {
        fullName: 'Grace Kim',
        gender: 'Female',
        dateOfBirth: '1996-03-25',
        email: 'grace.kim@hrms.com',
        phoneNumber: '+1-555-0110',
        position: 'HR Coordinator',
        department: 'Human Resources',
        basicSalary: 4800
      },

      {
        fullName: "Kevin O'Brien",
        gender: 'Male',
        dateOfBirth: '1989-07-08',
        email: 'kevin.obrien@hrms.com',
        phoneNumber: '+1-555-0111',
        position: 'Executive Assistant',
        department: 'Administration',
        basicSalary: 5200
      },

      {
        fullName: 'Priya Sharma',
        gender: 'Female',
        dateOfBirth: '1992-01-30',
        email: 'priya.sharma@hrms.com',
        phoneNumber: '+1-555-0112',
        position: 'Backend Developer',
        department: 'Information Technology',
        basicSalary: 7800
      }

    ];


    // CREATE SAMPLE EMPLOYEES + USERS
    for (const emp of sampleEmployees) {

      const employee = await Employee.create({

        ...emp,

        dateOfBirth: new Date(emp.dateOfBirth),

        department:
          deptMap[emp.department] ||
          deptMap['Administration'],

        address: {
          city: 'New York',
          state: 'NY',
          country: 'USA'
        },

        joiningDate: new Date(
          2021 + Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 12),
          1
        ),

        status: 'active'
      });


      const user = await User.create({
        fullName: emp.fullName,
        email: emp.email,
        password: 'Password@123',
        role: 'employee',
        employee: employee._id,
        isActive: true
      });


      employee.user = user._id;

      await employee.save();


      await Department.findByIdAndUpdate(
        employee.department,
        {
          $inc: {
            employeeCount: 1
          }
        }
      );

    }


    console.log(`✅ Created ${sampleEmployees.length} employees`);

    console.log('\n🎉 Seed completed successfully!\n');

    console.log('Admin Login');
    console.log('Email: admin@hrms.com');
    console.log('Password: Admin@123\n');

    console.log('HR Manager Login');
    console.log('Email: hr@hrms.com');
    console.log('Password: Admin@123\n');

    console.log('Employee Login');
    console.log('Email: james.wilson@hrms.com');
    console.log('Password: Password@123\n');


    await mongoose.connection.close();

    process.exit(0);

  } catch (error) {

    console.error('❌ Seed failed:', error);

    process.exit(1);

  }
};

seed();