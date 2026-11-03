const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const Assignment = require('../models/Assignment');
const { logAudit } = require('../services/auditService');

// @desc    Get all employees with search and department filtering
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { employeeId: searchRegex },
        { email: searchRegex },
        { designation: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate currently assigned assets count for each employee
    const employeesWithAssets = await Promise.all(
      employees.map(async (emp) => {
        const assignedCount = await Asset.countDocuments({
          assignedEmployee: emp._id,
          status: 'Assigned'
        });
        return {
          ...emp.toObject(),
          assignedAssetsCount: assignedCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: employeesWithAssets.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      employees: employeesWithAssets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee details with assigned assets & history
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Currently assigned assets
    const currentAssets = await Asset.find({
      assignedEmployee: employee._id,
      status: 'Assigned'
    });

    // Past and current assignment history
    const assignmentHistory = await Assignment.find({ employee: employee._id })
      .populate('asset', 'name assetId category brand model serialNumber status')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      employee: {
        ...employee.toObject(),
        assignedAssetsCount: currentAssets.length
      },
      currentAssets,
      assignmentHistory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin, Manager)
const createEmployee = async (req, res, next) => {
  try {
    const { name, employeeId, email, phone, department, designation, joiningDate, status } = req.body;

    if (!name || !employeeId || !email || !phone || !department || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Name, Employee ID, Email, Phone, Department, Designation).'
      });
    }

    // Check duplicate employeeId
    const existingEmpId = await Employee.findOne({ employeeId: employeeId.trim().toUpperCase() });
    if (existingEmpId) {
      return res.status(400).json({
        success: false,
        message: `Employee ID '${employeeId}' is already registered.`
      });
    }

    // Check duplicate email
    const existingEmail = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `An employee with email '${email}' already exists.`
      });
    }

    const employee = await Employee.create({
      name: name.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      department: department.trim(),
      designation: designation.trim(),
      joiningDate: joiningDate || Date.now(),
      status: status || 'Active'
    });

    await logAudit({
      user: req.user,
      action: 'EMPLOYEE_CREATED',
      module: 'EMPLOYEES',
      targetId: employee._id,
      targetName: `${employee.name} (${employee.employeeId})`,
      details: { department: employee.department, designation: employee.designation },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
// @access  Private (Admin, Manager)
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const { name, employeeId, email, phone, department, designation, joiningDate, status } = req.body;

    // Check unique employeeId if modified
    if (employeeId && employeeId.trim().toUpperCase() !== employee.employeeId) {
      const duplicate = await Employee.findOne({ employeeId: employeeId.trim().toUpperCase() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Employee ID '${employeeId}' is already in use.`
        });
      }
      employee.employeeId = employeeId.trim().toUpperCase();
    }

    // Check unique email if modified
    if (email && email.toLowerCase().trim() !== employee.email) {
      const duplicate = await Employee.findOne({ email: email.toLowerCase().trim() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Email '${email}' is already in use by another employee.`
        });
      }
      employee.email = email.toLowerCase().trim();
    }

    if (name) employee.name = name.trim();
    if (phone) employee.phone = phone.trim();
    if (department) employee.department = department.trim();
    if (designation) employee.designation = designation.trim();
    if (joiningDate) employee.joiningDate = joiningDate;
    if (status) employee.status = status;

    await employee.save();

    await logAudit({
      user: req.user,
      action: 'EMPLOYEE_UPDATED',
      module: 'EMPLOYEES',
      targetId: employee._id,
      targetName: `${employee.name} (${employee.employeeId})`,
      details: { department: employee.department, designation: employee.designation, status: employee.status },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if employee has assigned assets
    const assignedAssets = await Asset.countDocuments({
      assignedEmployee: employee._id,
      status: 'Assigned'
    });
    if (assignedAssets > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete employee '${employee.name}' because they currently have ${assignedAssets} active assigned asset(s). Return or reassign the assets first.`
      });
    }

    const empIdentifier = `${employee.name} (${employee.employeeId})`;
    await Employee.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user,
      action: 'EMPLOYEE_DELETED',
      module: 'EMPLOYEES',
      targetId: req.params.id,
      targetName: empIdentifier,
      details: {},
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Employee '${empIdentifier}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
