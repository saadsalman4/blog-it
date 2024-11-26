import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

export const sequelizeConfig = async (
  configService: ConfigService,
): Promise<SequelizeModuleOptions> => ({
  dialect: 'mssql', // Azure SQL uses MSSQL
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT') || 1433, 
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  autoLoadModels: true,
  synchronize: configService.get<boolean>('DB_SYNC') || false, // Disable in production
  // logging: configService.get<string>('NODE_ENV') === 'development', // Enable in dev mode
  logging: false,
  dialectOptions: {
    encrypt: true, // Required for Azure SQL
    options: {
      enableArithAbort: true, // Recommended for Azure SQL
    },
  },
});
