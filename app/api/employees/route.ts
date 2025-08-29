import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { hashPassword, authorizeRole, normalizePhone } from '../../../lib/auth';
import { createEmployeeSchema } from '../../../lib/validations';
import { getRolePermissions } from '../../../lib/permissions';
import type { Permission } from '../../../models/User';

// GET - Fetch all employees for the shop (owner only)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check authorization - only owners can view employees
    const authCheck = await authorizeRole(['owner'])(request);
    
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const { user: tokenUser } = authCheck;

    // Fetch all employees for the same shop
    const employees = await User.find({
      shopId: tokenUser!.shopId,
      role: { $ne: 'owner' } // Exclude owners
    }).select('-hashedPassword'); // Don't return passwords

    return NextResponse.json({
      employees: employees.map(emp => ({
        id: emp._id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        permissions: emp.permissions || getRolePermissions(emp.role),
        preferredLanguage: emp.preferredLanguage,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
      })),
    });

  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new employee (owner only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check authorization - only owners can create employees
    const authCheck = await authorizeRole(['owner'])(request);
    
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const { user: tokenUser } = authCheck;

    const body = await request.json();
    
    // Validate input data
    const validationResult = createEmployeeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Normalize phone number if provided
    const normalizedPhone = data.phone ? normalizePhone(data.phone) : null;

    // Check if employee already exists
    const existingEmployee = await User.findOne({
      $or: [
        ...(data.email ? [{ email: data.email }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
      ]
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Set permissions: use custom permissions if provided, otherwise use role defaults
    const permissions = body.permissions && Array.isArray(body.permissions) 
      ? body.permissions.filter((p: string) => typeof p === 'string') // Validate permissions
      : getRolePermissions(data.role);

    // Create employee user
    const employee = new User({
      name: data.name,
      email: data.email || undefined,
      phone: normalizedPhone || undefined,
      hashedPassword,
      preferredLanguage: data.preferredLanguage || 'fr',
      role: data.role,
      permissions,
      shopId: tokenUser!.shopId, // Same shop as owner
    });

    const savedEmployee = await employee.save();

    return NextResponse.json({
      message: 'Employee created successfully',
      employee: {
        id: savedEmployee._id,
        name: savedEmployee.name,
        email: savedEmployee.email,
        phone: savedEmployee.phone,
        role: savedEmployee.role,
        preferredLanguage: savedEmployee.preferredLanguage,
        createdAt: savedEmployee.createdAt,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Employee creation error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update employee (owner only)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Check authorization - only owners can update employees
    const authCheck = await authorizeRole(['owner'])(request);
    
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const { user: tokenUser } = authCheck;
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find employee in same shop
    const employee = await User.findOne({
      _id: employeeId,
      shopId: tokenUser!.shopId,
      role: { $ne: 'owner' } // Cannot update owners
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or access denied' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.phone = normalizePhone(body.phone);
    if (body.role && ['cashier', 'accountant', 'manager'].includes(body.role)) {
      updateData.role = body.role;
    }
    if (body.preferredLanguage) updateData.preferredLanguage = body.preferredLanguage;

    const updatedEmployee = await User.findByIdAndUpdate(
      employeeId,
      updateData,
      { new: true, runValidators: true }
    ).select('-hashedPassword');

    return NextResponse.json({
      message: 'Employee updated successfully',
      employee: {
        id: updatedEmployee!._id,
        name: updatedEmployee!.name,
        email: updatedEmployee!.email,
        phone: updatedEmployee!.phone,
        role: updatedEmployee!.role,
        preferredLanguage: updatedEmployee!.preferredLanguage,
        updatedAt: updatedEmployee!.updatedAt,
      },
    });

  } catch (error: any) {
    console.error('Employee update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove employee (owner only)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Check authorization - only owners can delete employees
    const authCheck = await authorizeRole(['owner'])(request);
    
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const { user: tokenUser } = authCheck;
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Find and delete employee in same shop
    const deletedEmployee = await User.findOneAndDelete({
      _id: employeeId,
      shopId: tokenUser!.shopId,
      role: { $ne: 'owner' } // Cannot delete owners
    });

    if (!deletedEmployee) {
      return NextResponse.json(
        { error: 'Employee not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Employee deleted successfully',
      deletedEmployeeId: employeeId,
    });

  } catch (error: any) {
    console.error('Employee deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
