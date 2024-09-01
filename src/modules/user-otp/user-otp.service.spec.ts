import { Test, TestingModule } from '@nestjs/testing';
import { UserOtpService } from './user-otp.service';

describe('UserOtpService', () => {
  let service: UserOtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserOtpService],
    }).compile();

    service = module.get<UserOtpService>(UserOtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
