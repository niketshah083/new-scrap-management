import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, IsNull } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../entities/user.entity";
import { Role } from "../../entities/role.entity";
import {
  CreateSuperAdminDto,
  CreateTenantUserDto,
  UpdateUserDto,
  UpdateUserRoleDto,
  ChangePasswordDto,
  ResetPasswordDto,
} from "./dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Super Admin Management
  async createSuperAdmin(
    createDto: CreateSuperAdminDto,
    createdByUserId: number
  ): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await this.hashPassword(createDto.password);

    const user = this.userRepository.create({
      name: createDto.name,
      email: createDto.email,
      password: hashedPassword,
      isSuperAdmin: true,
      isActive: true,
      createdBy: createdByUserId,
      updatedBy: createdByUserId,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async findAllSuperAdmins(): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { isSuperAdmin: true },
      select: ["id", "name", "email", "isActive", "createdAt", "updatedAt"],
    });
    return users;
  }

  async findSuperAdminById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isSuperAdmin: true },
      select: ["id", "name", "email", "isActive", "createdAt", "updatedAt"],
    });

    if (!user) {
      throw new NotFoundException(`Super admin with ID ${id} not found`);
    }

    return user;
  }

  async updateSuperAdmin(
    id: number,
    updateDto: UpdateUserDto,
    updatedByUserId: number
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isSuperAdmin: true },
    });

    if (!user) {
      throw new NotFoundException(`Super admin with ID ${id} not found`);
    }

    // Check email uniqueness if updating email
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateDto.email },
      });
      if (existingUser) {
        throw new ConflictException("Email already exists");
      }
    }

    Object.assign(user, updateDto);
    user.updatedBy = updatedByUserId;

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async removeSuperAdmin(id: number, deletedByUserId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, isSuperAdmin: true },
    });

    if (!user) {
      throw new NotFoundException(`Super admin with ID ${id} not found`);
    }

    user.deletedBy = deletedByUserId;
    await this.userRepository.save(user);
    await this.userRepository.softRemove(user);
  }

  // Tenant User Management
  async createTenantUser(
    tenantId: number,
    createDto: CreateTenantUserDto,
    createdByUserId: number
  ): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    // Verify role exists and belongs to tenant
    const role = await this.roleRepository.findOne({
      where: { id: createDto.roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${createDto.roleId} not found`);
    }

    const hashedPassword = await this.hashPassword(createDto.password);

    const user = this.userRepository.create({
      tenantId,
      name: createDto.name,
      email: createDto.email,
      password: hashedPassword,
      roleId: createDto.roleId,
      isSuperAdmin: false,
      isActive: true,
      createdBy: createdByUserId,
      updatedBy: createdByUserId,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async findAllTenantUsers(tenantId: number): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { tenantId, isSuperAdmin: false },
      relations: ["role"],
      select: [
        "id",
        "name",
        "email",
        "roleId",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
    return users;
  }

  async findTenantUserById(tenantId: number, id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, isSuperAdmin: false },
      relations: ["role", "role.permissions"],
      select: [
        "id",
        "name",
        "email",
        "roleId",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateTenantUser(
    tenantId: number,
    id: number,
    updateDto: UpdateUserDto,
    updatedByUserId: number
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, isSuperAdmin: false },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness if updating email
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateDto.email },
      });
      if (existingUser) {
        throw new ConflictException("Email already exists");
      }
    }

    Object.assign(user, updateDto);
    user.updatedBy = updatedByUserId;

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async updateUserRole(
    tenantId: number,
    id: number,
    updateDto: UpdateUserRoleDto,
    updatedByUserId: number
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, isSuperAdmin: false },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify role exists and belongs to tenant
    const role = await this.roleRepository.findOne({
      where: { id: updateDto.roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${updateDto.roleId} not found`);
    }

    user.roleId = updateDto.roleId;
    user.updatedBy = updatedByUserId;

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async removeTenantUser(
    tenantId: number,
    id: number,
    deletedByUserId: number
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, isSuperAdmin: false },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.deletedBy = deletedByUserId;
    await this.userRepository.save(user);
    await this.userRepository.softRemove(user);
  }

  // Password Management
  async changePassword(
    userId: number,
    changeDto: ChangePasswordDto
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const isValidPassword = await this.verifyPassword(
      changeDto.currentPassword,
      user.password
    );

    if (!isValidPassword) {
      throw new BadRequestException("Current password is incorrect");
    }

    user.password = await this.hashPassword(changeDto.newPassword);
    user.updatedBy = userId;
    await this.userRepository.save(user);
  }

  async resetPassword(
    tenantId: number | null,
    userId: number,
    resetDto: ResetPasswordDto,
    resetByUserId: number
  ): Promise<void> {
    let user: User;

    if (tenantId) {
      user = await this.userRepository.findOne({
        where: { id: userId, tenantId },
      });
    } else {
      user = await this.userRepository.findOne({
        where: { id: userId, isSuperAdmin: true },
      });
    }

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    user.password = await this.hashPassword(resetDto.newPassword);
    user.updatedBy = resetByUserId;
    await this.userRepository.save(user);
  }
}
