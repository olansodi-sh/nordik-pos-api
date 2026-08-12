import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KitComponent } from './entities/kit-component.entity';
import { ProductsService } from './products.service';
import { AddKitComponentDto } from './dto/add-kit-component.dto';

@Injectable()
export class KitComponentsService {
  constructor(
    @InjectRepository(KitComponent)
    private readonly kitComponentsRepository: Repository<KitComponent>,
    private readonly productsService: ProductsService,
  ) {}

  async findByKit(kitProductId: string): Promise<KitComponent[]> {
    await this.productsService.findOneOrFail(kitProductId);
    return this.kitComponentsRepository.find({ where: { kitProductId } });
  }

  async add(
    kitProductId: string,
    dto: AddKitComponentDto,
  ): Promise<KitComponent> {
    await this.productsService.findOneOrFail(kitProductId);
    await this.productsService.findOneOrFail(dto.componentProductId);

    return this.kitComponentsRepository.save(
      this.kitComponentsRepository.create({
        kitProductId,
        componentProductId: dto.componentProductId,
        quantity: dto.quantity,
      }),
    );
  }

  async remove(kitProductId: string, componentId: string): Promise<void> {
    await this.productsService.findOneOrFail(kitProductId);
    const component = await this.kitComponentsRepository.findOne({
      where: { id: componentId, kitProductId },
    });
    if (!component) {
      throw new NotFoundException(`Kit component ${componentId} not found`);
    }
    await this.kitComponentsRepository.remove(component);
  }
}
