import { Test, TestingModule } from '@nestjs/testing';
import { SystempagesService } from './systempages.service';

describe('SystempagesService', () => {
  let service: SystempagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystempagesService],
    }).compile();

    service = module.get<SystempagesService>(SystempagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
