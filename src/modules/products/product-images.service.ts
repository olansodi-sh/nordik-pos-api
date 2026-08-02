import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from './entities/product-image.entity';
import { ProductsService } from './products.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imagesRepository: Repository<ProductImage>,
    private readonly productsService: ProductsService,
  ) {}

  async findByProduct(productId: string): Promise<ProductImage[]> {
    await this.productsService.findOneOrFail(productId);
    return this.imagesRepository.find({
      where: { productId },
      order: { order: 'ASC' },
    });
  }

  async add(
    productId: string,
    dto: CreateProductImageDto,
  ): Promise<ProductImage> {
    await this.productsService.findOneOrFail(productId);
    return this.imagesRepository.save(
      this.imagesRepository.create({
        productId,
        url: dto.url,
        order: dto.order ?? 0,
      }),
    );
  }

  async remove(productId: string, imageId: string): Promise<void> {
    await this.productsService.findOneOrFail(productId);
    const image = await this.imagesRepository.findOne({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }
    await this.imagesRepository.softRemove(image);
  }
}
