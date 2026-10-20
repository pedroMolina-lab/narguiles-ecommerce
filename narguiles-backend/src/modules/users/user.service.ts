import { AppError } from '../../utils/AppError';
import { userRepository } from './user.repository';
import type { PublicUser, User } from './user.types';

export const toPublicUser = ({ passwordHash: _omit, ...rest }: User): PublicUser => rest;

export const userService = {
  async getPublicById(id: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return toPublicUser(user);
  },
};
