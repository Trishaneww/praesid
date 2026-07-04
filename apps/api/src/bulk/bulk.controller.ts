import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BulkUploadSummary } from '@praesid/shared';
import { BulkService } from './bulk.service';
import { CreateBulkUploadDto } from './dto/create-bulk-upload.dto';
import { ListBulkUploadsDto } from './dto/list-bulk-uploads.dto';

@Controller('bulk-uploads')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post()
  createUpload(@Body() dto: CreateBulkUploadDto): Promise<BulkUploadSummary> {
    return this.bulkService.createUpload(dto);
  }

  @Get()
  listUploads(
    @Query() query: ListBulkUploadsDto,
  ): Promise<BulkUploadSummary[]> {
    return this.bulkService.listUploads(query.tenantId);
  }

  @Get(':id')
  getUpload(@Param('id') id: string): Promise<BulkUploadSummary> {
    return this.bulkService.getUpload(id);
  }
}
