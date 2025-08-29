import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import User from '../../../../models/User';
import { authorizeRole, normalizePhone } from '../../../../lib/auth';
import { getRolePermissions } from '../../../../lib/permissions';
import type { Permission } from '../../../../models/User';

// GET - Fetch specific employee (owner only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id: employeeId } = params;

    // Find employee in same shop
    const employee = await User.findOne({
      _id: employeeId,
      shopId: tokenUser!.shopId,
      role: { $ne: 'owner' } // Exclude owners
    }).select('-hashedPassword');

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        permissions: employee.permissions || getRolePermissions(employee.role),
        preferredLanguage: employee.preferredLanguage,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
    });

  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update specific employee (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id: employeeId } = params;

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

    // Check for duplicate email/phone if updating
    if (body.email || body.phone) {
      const normalizedPhone = body.phone ? normalizePhone(body.phone) : null;
      
      const duplicateCheck = await User.findOne({
        _id: { $ne: employeeId }, // Exclude current employee
        $or: [
          ...(body.email ? [{ email: body.email }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
        ]
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { error: 'Employee with this email or phone already exists' },
          { status: 409 }
        );
      }
    }

    // Update allowed fields
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.phone !== undefined) {
      updateData.phone = body.phone ? normalizePhone(body.phone) : null;
    }
    if (body.role && ['cashier', 'accountant', 'manager'].includes(body.role)) {
      updateData.role = body.role;
    }
    if (body.preferredLanguage) updateData.preferredLanguage = body.preferredLanguage;
    
    // Update permissions if provided, otherwise keep existing or set role defaults
    if (body.permissions && Array.isArray(body.permissions)) {
      updateData.permissions = body.permissions.filter((p: string) => typeof p === 'string');
    }

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
        permissions: updatedEmployee!.permissions || getRolePermissions(updatedEmployee!.role),
        preferredLanguage: updatedEmployee!.preferredLanguage,
        updatedAt: updatedEmployee!.updatedAt,
      },
    });

  } catch (error: any) {
    console.error('Employee update error:', error);
    
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

// DELETE - Remove specific employee (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id: employeeId } = params;

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
