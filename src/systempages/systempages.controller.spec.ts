import { Test, TestingModule } from '@nestjs/testing';
import { SystempagesController } from './systempages.controller';

describe('SystempagesController', () => {
  let controller: SystempagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystempagesController],
    }).compile();

    controller = module.get<SystempagesController>(SystempagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
