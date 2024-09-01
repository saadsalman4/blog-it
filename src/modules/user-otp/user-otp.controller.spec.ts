import { Test, TestingModule } from '@nestjs/testing';
import { UserOtpController } from './user-otp.controller';

describe('UserOtpController', () => {
  let controller: UserOtpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserOtpController],
    }).compile();

    controller = module.get<UserOtpController>(UserOtpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
