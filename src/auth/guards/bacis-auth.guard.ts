import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return false;
      }

      const base64Auth = authHeader.split(' ')[1];
      const decodedAuth = JSON.parse(atob(base64Auth));

      if (decodedAuth.user && decodedAuth.user.id) {
        request.user = decodedAuth.user;
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }
}
