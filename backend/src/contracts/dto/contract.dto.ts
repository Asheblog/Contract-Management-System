import { IsString, IsOptional, IsDateString, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractDto {
    @IsString()
    name: string;

    @IsString()
    partner: string;

    @IsDateString()
    signDate: string;

    @IsDateString()
    expireDate: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsObject()
    customData?: Record<string, any>;
}

export class UpdateContractDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    partner?: string;

    @IsOptional()
    @IsDateString()
    signDate?: string;

    @IsOptional()
    @IsDateString()
    expireDate?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsBoolean()
    isProcessed?: boolean;

    @IsOptional()
    @IsObject()
    customData?: Record<string, any>;
}

export class ContractQueryDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    limit?: number;

    @IsOptional()
    @IsString()
    sortField?: string;

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';
}
