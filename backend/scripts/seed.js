const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const QRCode = require('qrcode');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const Assignment = require('../models/Assignment');
const Booking = require('../models/Booking');
const Maintenance = require('../models/Maintenance');
const AuditLog = require('../models/AuditLog');

const seedDatabase = async () => {
  console.log('[SEED] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Asset.deleteMany({}),
    Assignment.deleteMany({}),
    Booking.deleteMany({}),
    Maintenance.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[SEED] Creating Users...');
  const adminUser = await User.create({
    name: 'Alexander Vance',
    email: 'admin@assetflow.com',
    password: 'Admin@123',
    role: 'ADMIN',
    department: 'Executive Management',
    phone: '+1 (555) 019-2831'
  });

  const managerUser = await User.create({
    name: 'Rachel Sterling',
    email: 'manager@assetflow.com',
    password: 'Manager@123',
    role: 'MANAGER',
    department: 'Operations & IT',
    phone: '+1 (555) 018-9942'
  });

  const empUser1 = await User.create({
    name: 'Sarah Jenkins',
    email: 'employee1@assetflow.com',
    password: 'Employee@123',
    role: 'EMPLOYEE',
    department: 'Engineering',
    phone: '+1 (555) 014-3829'
  });

  const empUser2 = await User.create({
    name: 'David Chen',
    email: 'employee2@assetflow.com',
    password: 'Employee@123',
    role: 'EMPLOYEE',
    department: 'Product & Design',
    phone: '+1 (555) 016-7721'
  });

  const empUser3 = await User.create({
    name: 'Elena Rostova',
    email: 'employee3@assetflow.com',
    password: 'Employee@123',
    role: 'EMPLOYEE',
    department: 'Marketing & Sales',
    phone: '+1 (555) 012-4418'
  });

  console.log('[SEED] Creating Employees...');
  const emp1 = await Employee.create({
    name: 'Sarah Jenkins',
    employeeId: 'EMP-1001',
    email: 'employee1@assetflow.com',
    phone: '+1 (555) 014-3829',
    department: 'Engineering',
    designation: 'Staff Software Architect',
    joiningDate: new Date('2022-03-15'),
    status: 'Active'
  });

  const emp2 = await Employee.create({
    name: 'David Chen',
    employeeId: 'EMP-1002',
    email: 'employee2@assetflow.com',
    phone: '+1 (555) 016-7721',
    department: 'Product & Design',
    designation: 'Principal UI/UX Designer',
    joiningDate: new Date('2022-07-01'),
    status: 'Active'
  });

  const emp3 = await Employee.create({
    name: 'Elena Rostova',
    employeeId: 'EMP-1003',
    email: 'employee3@assetflow.com',
    phone: '+1 (555) 012-4418',
    department: 'Marketing & Sales',
    designation: 'Growth Marketing Director',
    joiningDate: new Date('2023-01-10'),
    status: 'Active'
  });

  await Employee.create({
    name: 'Marcus Brody',
    employeeId: 'EMP-1004',
    email: 'marcus.brody@assetflow.com',
    phone: '+1 (555) 015-6612',
    department: 'Customer Success',
    designation: 'Technical Support Lead',
    joiningDate: new Date('2023-04-20'),
    status: 'Active'
  });

  await Employee.create({
    name: 'Aisha Al-Mansoor',
    employeeId: 'EMP-1005',
    email: 'aisha.m@assetflow.com',
    phone: '+1 (555) 017-8893',
    department: 'Finance & Legal',
    designation: 'Senior Financial Analyst',
    joiningDate: new Date('2023-09-01'),
    status: 'Active'
  });

  console.log('[SEED] Generating 18 Assets with QR Codes...');
  const rawAssets = [
    {
      name: 'MacBook Pro 16" M3 Max',
      assetId: 'AST-1001',
      category: 'Laptop',
      brand: 'Apple',
      model: 'MacBook Pro 16 (2024)',
      serialNumber: 'C02G90J0MD6R',
      purchaseDate: new Date('2024-01-15'),
      purchasePrice: 3499,
      location: 'HQ - Floor 4 Engineering',
      department: 'Engineering',
      status: 'Assigned',
      assignedEmployee: emp1._id,
      warrantyExpiryDate: new Date('2027-01-15'),
      description: '36GB Unified Memory, 1TB SSD, Space Black. Assigned for core software development.'
    },
    {
      name: 'Dell XPS 15 9530',
      assetId: 'AST-1002',
      category: 'Laptop',
      brand: 'Dell',
      model: 'XPS 15 OLED',
      serialNumber: 'DL-XPS-992182',
      purchaseDate: new Date('2023-11-20'),
      purchasePrice: 2299,
      location: 'HQ - Floor 3 Design Studio',
      department: 'Product & Design',
      status: 'Assigned',
      assignedEmployee: emp2._id,
      warrantyExpiryDate: new Date('2026-11-20'),
      description: 'Intel i7-13700H, 32GB RAM, RTX 4060, 3.5K OLED touchscreen.'
    },
    {
      name: 'Lenovo ThinkPad X1 Carbon Gen 11',
      assetId: 'AST-1003',
      category: 'Laptop',
      brand: 'Lenovo',
      model: 'ThinkPad X1 Carbon',
      serialNumber: 'PF-2K90A11',
      purchaseDate: new Date('2024-02-05'),
      purchasePrice: 1850,
      location: 'HQ - Floor 2 Marketing',
      department: 'Marketing & Sales',
      status: 'Assigned',
      assignedEmployee: emp3._id,
      warrantyExpiryDate: new Date('2027-02-05'),
      description: 'Ultralight business laptop with 14" WUXGA display, 16GB RAM.'
    },
    {
      name: 'Apple Studio Display 27" 5K',
      assetId: 'AST-1004',
      category: 'Monitor',
      brand: 'Apple',
      model: 'Studio Display Nano-texture',
      serialNumber: 'AP-SD-55102',
      purchaseDate: new Date('2023-08-10'),
      purchasePrice: 1899,
      location: 'HQ - Floor 3 Design Studio',
      department: 'Product & Design',
      status: 'Assigned',
      assignedEmployee: emp2._id,
      warrantyExpiryDate: new Date('2026-08-10'),
      description: '5K Retina display with nano-texture glass and tilt-adjustable stand.'
    },
    {
      name: 'Dell UltraSharp 34" Curved USB-C Hub',
      assetId: 'AST-1005',
      category: 'Monitor',
      brand: 'Dell',
      model: 'U3423WE',
      serialNumber: 'DL-MN-342301',
      purchaseDate: new Date('2023-09-18'),
      purchasePrice: 920,
      location: 'HQ - Floor 4 Engineering',
      department: 'Engineering',
      status: 'Assigned',
      assignedEmployee: emp1._id,
      warrantyExpiryDate: new Date('2026-09-18'),
      description: 'WQHD 3440 x 1440 curved IPS monitor with integrated 90W USB-C hub.'
    },
    {
      name: 'Mac Studio M2 Ultra',
      assetId: 'AST-1006',
      category: 'Desktop',
      brand: 'Apple',
      model: 'Mac Studio (2023)',
      serialNumber: 'MS-2U-88201',
      purchaseDate: new Date('2023-10-01'),
      purchasePrice: 3999,
      location: 'HQ - Media Server Room',
      department: 'Engineering',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2026-10-01'),
      description: '24-core CPU, 60-core GPU, 64GB Unified Memory. High-throughput build runner.'
    },
    {
      name: 'Precision 7960 Tower Workstation',
      assetId: 'AST-1007',
      category: 'Desktop',
      brand: 'Dell',
      model: 'Precision 7960',
      serialNumber: 'DL-WS-796001',
      purchaseDate: new Date('2024-03-01'),
      purchasePrice: 4750,
      location: 'HQ - AI Simulation Lab',
      department: 'Engineering',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2027-03-01'),
      description: 'Intel Xeon w7-2495X, 128GB ECC DDR5, dual NVIDIA RTX 6000 Ada.'
    },
    {
      name: 'iPhone 15 Pro Test Unit',
      assetId: 'AST-1008',
      category: 'Mobile',
      brand: 'Apple',
      model: 'iPhone 15 Pro 256GB',
      serialNumber: 'F17L90K9MD',
      purchaseDate: new Date('2023-10-12'),
      purchasePrice: 1099,
      location: 'HQ - QA Testing Lab',
      department: 'Engineering',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2025-10-12'),
      description: 'Titanium Blue test unit for mobile app compatibility and QA.'
    },
    {
      name: 'Google Pixel 8 Pro Test Device',
      assetId: 'AST-1009',
      category: 'Mobile',
      brand: 'Google',
      model: 'Pixel 8 Pro 128GB',
      serialNumber: 'G-PX8-99120',
      purchaseDate: new Date('2023-11-05'),
      purchasePrice: 999,
      location: 'HQ - QA Testing Lab',
      department: 'Engineering',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2025-11-05'),
      description: 'Bay Blue mobile QA test handset for Android release validation.'
    },
    {
      name: 'HP Color LaserJet Enterprise Flow MFP',
      assetId: 'AST-1010',
      category: 'Printer',
      brand: 'HP',
      model: 'LaserJet X67755zs',
      serialNumber: 'HP-LJ-67755',
      purchaseDate: new Date('2023-04-10'),
      purchasePrice: 2850,
      location: 'HQ - Floor 2 Print Center',
      department: 'Operations',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2026-04-10'),
      description: 'High-volume duplex enterprise multifunction network printer.'
    },
    {
      name: 'Cisco Catalyst 9300 48-Port Switch',
      assetId: 'AST-1011',
      category: 'Networking Equipment',
      brand: 'Cisco',
      model: 'C9300-48P',
      serialNumber: 'FCW2348A09',
      purchaseDate: new Date('2022-12-01'),
      purchasePrice: 4200,
      location: 'HQ - MDF Server Rack 2',
      department: 'Operations & IT',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2027-12-01'),
      description: 'Gigabit PoE+ network core switch connecting 4th-floor workstations.'
    },
    {
      name: 'Ubiquiti UniFi Enterprise AP WiFi 6E',
      assetId: 'AST-1012',
      category: 'Networking Equipment',
      brand: 'Ubiquiti',
      model: 'U6-Enterprise',
      serialNumber: 'UB-6E-88391',
      purchaseDate: new Date('2023-06-14'),
      purchasePrice: 299,
      location: 'HQ - 3rd Floor Ceiling Node',
      department: 'Operations & IT',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2025-06-14'),
      description: 'Tri-band WiFi 6E access point delivering high-density wireless coverage.'
    },
    {
      name: 'Herman Miller Aeron Ergonomic Chair',
      assetId: 'AST-1013',
      category: 'Furniture',
      brand: 'Herman Miller',
      model: 'Aeron Size B Mineral',
      serialNumber: 'HM-AR-2023-09',
      purchaseDate: new Date('2023-05-18'),
      purchasePrice: 1450,
      location: 'HQ - Floor 4 Workstation 402',
      department: 'Engineering',
      status: 'Assigned',
      assignedEmployee: emp1._id,
      warrantyExpiryDate: new Date('2035-05-18'),
      description: 'Ergonomic task chair with PostureFit SL lumbar support and forward tilt.'
    },
    {
      name: 'Steelcase Gesture Ergonomic Chair',
      assetId: 'AST-1014',
      category: 'Furniture',
      brand: 'Steelcase',
      model: 'Gesture Dark Finish',
      serialNumber: 'SC-GS-77123',
      purchaseDate: new Date('2023-06-20'),
      purchasePrice: 1380,
      location: 'HQ - Floor 3 Workstation 310',
      department: 'Product & Design',
      status: 'Assigned',
      assignedEmployee: emp2._id,
      warrantyExpiryDate: new Date('2035-06-20'),
      description: '360-degree arm adjustable ergonomic seating for creative professionals.'
    },
    {
      name: 'Sony FE 4K Conference PTZ Camera',
      assetId: 'AST-1015',
      category: 'Other',
      brand: 'Sony',
      model: 'SRG-X400 4K PTZ',
      serialNumber: 'SN-PTZ-4009',
      purchaseDate: new Date('2023-02-14'),
      purchasePrice: 2490,
      location: 'HQ - Boardroom Alpha',
      department: 'Operations & IT',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2026-02-14'),
      description: 'Pan-Tilt-Zoom optical conference camera with NDI support for virtual AGMs.'
    },
    {
      name: 'Lenovo ThinkVision 27" 4K Monitor',
      assetId: 'AST-1016',
      category: 'Monitor',
      brand: 'Lenovo',
      model: 'P27u-20 Thunderbolt 4',
      serialNumber: 'LV-MN-27401',
      purchaseDate: new Date('2023-03-25'),
      purchasePrice: 650,
      location: 'HQ - Floor 1 IT Storage',
      department: 'Operations & IT',
      status: 'Under Maintenance',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2026-03-25'),
      description: 'Reported display flickering on USB-C port. Currently in hardware diagnostic lab.'
    },
    {
      name: 'MacBook Pro 14" M1 Pro (Legacy)',
      assetId: 'AST-1017',
      category: 'Laptop',
      brand: 'Apple',
      model: 'MacBook Pro 14 (2021)',
      serialNumber: 'C02F8099M8',
      purchaseDate: new Date('2021-11-10'),
      purchasePrice: 1999,
      location: 'HQ - IT Archive & Surplus',
      department: 'Operations & IT',
      status: 'Retired',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2024-11-10'),
      description: 'Decommissioned following standard 3-year enterprise hardware refresh cycle.'
    },
    {
      name: 'Epson Pro Cinema 4K Laser Projector',
      assetId: 'AST-1018',
      category: 'Other',
      brand: 'Epson',
      model: 'LS12000 4K Laser',
      serialNumber: 'EP-LS-12009',
      purchaseDate: new Date('2023-05-12'),
      purchasePrice: 3999,
      location: 'HQ - Main Auditorium',
      department: 'Operations & IT',
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: new Date('2026-05-12'),
      description: 'Ultra-bright 2700 lumens laser projector for company all-hands and presentations.'
    }
  ];

  const savedAssets = [];
  for (const item of rawAssets) {
    const qrPayload = JSON.stringify({
      assetId: item.assetId,
      name: item.name,
      category: item.category,
      serialNumber: item.serialNumber
    });
    let qrCodeData = '';
    try {
      qrCodeData = await QRCode.toDataURL(qrPayload);
    } catch (err) {
      // ignore
    }
    const asset = await Asset.create({ ...item, qrCodeData });
    savedAssets.push(asset);
  }

  console.log(`[SEED] Created ${savedAssets.length} assets.`);

  console.log('[SEED] Creating Sample Assignments...');
  await Assignment.create({
    asset: savedAssets[0]._id,
    employee: emp1._id,
    assignedBy: adminUser._id,
    assignmentDate: new Date('2024-01-20'),
    expectedReturnDate: new Date('2025-01-20'),
    status: 'Active',
    notes: 'Initial developer laptop rollout.'
  });

  await Assignment.create({
    asset: savedAssets[1]._id,
    employee: emp2._id,
    assignedBy: managerUser._id,
    assignmentDate: new Date('2023-11-25'),
    expectedReturnDate: new Date('2025-05-01'),
    status: 'Active',
    notes: 'Design workstation assignment.'
  });

  await Assignment.create({
    asset: savedAssets[2]._id,
    employee: emp3._id,
    assignedBy: adminUser._id,
    assignmentDate: new Date('2024-02-10'),
    expectedReturnDate: new Date('2025-02-10'),
    status: 'Active',
    notes: 'Sales enablement device.'
  });

  await Assignment.create({
    asset: savedAssets[5]._id,
    employee: emp1._id,
    assignedBy: managerUser._id,
    assignmentDate: new Date('2023-10-05'),
    expectedReturnDate: new Date('2024-01-15'),
    actualReturnDate: new Date('2024-01-14'),
    status: 'Returned',
    notes: 'Temporary build cluster setup.',
    returnNotes: 'Returned in pristine condition after cloud CI migration.'
  });

  console.log('[SEED] Creating Sample Resource Bookings...');
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 3);
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(nextWeekEnd.getHours() + 4);

  await Booking.create({
    asset: savedAssets[17]._id,
    requestedBy: empUser3._id,
    startDate: nextWeek,
    endDate: nextWeekEnd,
    purpose: 'Q4 Product Launch & All-Hands Presentation',
    status: 'Approved',
    reviewedBy: managerUser._id,
    reviewNotes: 'Auditorium reserved. Technical support technician notified.'
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(tomorrowEnd.getHours() + 6);

  await Booking.create({
    asset: savedAssets[7]._id,
    requestedBy: empUser1._id,
    startDate: tomorrow,
    endDate: tomorrowEnd,
    purpose: 'Biometric FaceID performance benchmarking',
    status: 'Pending'
  });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const futureDateEnd = new Date(futureDate);
  futureDateEnd.setHours(futureDateEnd.getHours() + 2);

  await Booking.create({
    asset: savedAssets[14]._id,
    requestedBy: empUser2._id,
    startDate: futureDate,
    endDate: futureDateEnd,
    purpose: 'Global Design Sprint with London agency partners',
    status: 'Approved',
    reviewedBy: adminUser._id,
    reviewNotes: 'Boardroom Alpha confirmed.'
  });

  console.log('[SEED] Creating Sample Maintenance Records...');
  await Maintenance.create({
    asset: savedAssets[15]._id,
    reportedBy: empUser1._id,
    issueDescription: 'Thunderbolt display flickers intermittently when running 4K at 60Hz.',
    priority: 'High',
    status: 'In Progress',
    assignedTechnician: 'Apex Hardware Support Services',
    maintenanceCost: 150,
    scheduledDate: new Date(),
    resolutionNotes: 'Replacing internal logic board power supply capacitor.'
  });

  await Maintenance.create({
    asset: savedAssets[9]._id,
    reportedBy: empUser3._id,
    issueDescription: 'Tray 2 paper jam sensor error 13.02.00 appearing repeatedly.',
    priority: 'Medium',
    status: 'Pending',
    scheduledDate: tomorrow
  });

  const pastDate = new Date();
  pastDate.setMonth(pastDate.getMonth() - 1);
  await Maintenance.create({
    asset: savedAssets[0]._id,
    reportedBy: empUser1._id,
    issueDescription: 'Keyboard spacebar sticking intermittently.',
    priority: 'Low',
    status: 'Completed',
    assignedTechnician: 'Apple Certified Technician',
    maintenanceCost: 0,
    scheduledDate: pastDate,
    completedDate: new Date(pastDate.getTime() + 86400000 * 2),
    resolutionNotes: 'Top case assembly serviced under AppleCare warranty.'
  });

  console.log('[SEED] Creating Audit Logs...');
  const auditEntries = [
    {
      user: adminUser._id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'ASSET_CREATED',
      module: 'ASSETS',
      targetId: savedAssets[0]._id.toString(),
      targetName: `${savedAssets[0].name} (${savedAssets[0].assetId})`,
      details: { category: 'Laptop', price: 3499 },
      timestamp: new Date('2024-01-15T09:30:00Z')
    },
    {
      user: adminUser._id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'ASSET_ASSIGNED',
      module: 'ASSIGNMENTS',
      targetId: savedAssets[0]._id.toString(),
      targetName: `${savedAssets[0].name} -> ${emp1.name}`,
      details: { employeeId: emp1.employeeId },
      timestamp: new Date('2024-01-20T11:15:00Z')
    },
    {
      user: managerUser._id,
      userName: managerUser.name,
      userEmail: managerUser.email,
      userRole: managerUser.role,
      action: 'BOOKING_APPROVED',
      module: 'BOOKINGS',
      targetId: savedAssets[17]._id.toString(),
      targetName: 'Auditorium Projector Booking Approved',
      details: { reviewer: managerUser.name },
      timestamp: new Date()
    },
    {
      user: empUser1._id,
      userName: empUser1.name,
      userEmail: empUser1.email,
      userRole: empUser1.role,
      action: 'MAINTENANCE_REQUESTED',
      module: 'MAINTENANCE',
      targetId: savedAssets[15]._id.toString(),
      targetName: 'Lenovo ThinkVision 27" 4K Monitor (High Priority)',
      details: { priority: 'High' },
      timestamp: new Date()
    }
  ];

  for (const log of auditEntries) {
    await AuditLog.create(log);
  }

  console.log('[SEED] Seed process completed successfully.');
};

// If run directly from command line
if (require.main === module) {
  const { connectDB } = require('../config/db');
  (async () => {
    try {
      console.log('[SEED] Connecting to MongoDB...');
      await connectDB();
      await seedDatabase();
      console.log('=====================================================');
      console.log('🎉 ASSETFLOW PRO DATABASE SEEDED SUCCESSFULLY!');
      console.log('=====================================================');
      process.exit(0);
    } catch (err) {
      console.error(`[SEED ERROR]: ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase };
