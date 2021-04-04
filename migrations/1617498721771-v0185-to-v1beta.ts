import {MigrationInterface, QueryRunner} from "typeorm";
import { addToDefaultChannel, migratePaymentMethods } from '../migration-utils';

export class v0185ToV1beta1617498721771 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "tag" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "value" character varying NOT NULL, "id" SERIAL NOT NULL, CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "asset_tags_tag" ("assetId" integer NOT NULL, "tagId" integer NOT NULL, CONSTRAINT "PK_c4113b84381e953901fa5553654" PRIMARY KEY ("assetId", "tagId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9e412b00d4c6cee1a4b3d92071" ON "asset_tags_tag" ("assetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_fb5e800171ffbe9823f2cc727f" ON "asset_tags_tag" ("tagId") `, undefined);
        await queryRunner.query(`CREATE TABLE "asset_channels_channel" ("assetId" integer NOT NULL, "channelId" integer NOT NULL, CONSTRAINT "PK_d943908a39e32952e8425d2f1ba" PRIMARY KEY ("assetId", "channelId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_dc4e7435f9f5e9e6436bebd33b" ON "asset_channels_channel" ("assetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_16ca9151a5153f1169da5b7b7e" ON "asset_channels_channel" ("channelId") `, undefined);
        await queryRunner.query(`CREATE TABLE "facet_channels_channel" ("facetId" integer NOT NULL, "channelId" integer NOT NULL, CONSTRAINT "PK_df0579886093b2f830c159adfde" PRIMARY KEY ("facetId", "channelId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_ca796020c6d097e251e5d6d2b0" ON "facet_channels_channel" ("facetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_2a8ea404d05bf682516184db7d" ON "facet_channels_channel" ("channelId") `, undefined);
        await queryRunner.query(`CREATE TABLE "facet_value_channels_channel" ("facetValueId" integer NOT NULL, "channelId" integer NOT NULL, CONSTRAINT "PK_653fb72a256f100f52c573e419f" PRIMARY KEY ("facetValueId", "channelId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_ad690c1b05596d7f52e52ffeed" ON "facet_value_channels_channel" ("facetValueId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e1d54c0b9db3e2eb17faaf5919" ON "facet_value_channels_channel" ("channelId") `, undefined);
        await queryRunner.query(`CREATE TABLE "payment_method_channels_channel" ("paymentMethodId" integer NOT NULL, "channelId" integer NOT NULL, CONSTRAINT "PK_c83e4a201c0402ce5cdb170a9a2" PRIMARY KEY ("paymentMethodId", "channelId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_5bcb569635ce5407eb3f264487" ON "payment_method_channels_channel" ("paymentMethodId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_c00e36f667d35031087b382e61" ON "payment_method_channels_channel" ("channelId") `, undefined);

        await queryRunner.query(`ALTER TABLE "payment_method" ADD "name" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" ADD "description" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" ADD "checker" text`, undefined);
        
        await queryRunner.query(`ALTER TABLE "payment_method" ADD "handler" text`, undefined);
        await migratePaymentMethods(queryRunner);
        await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "configArgs"`, undefined);

        console.log('after handler');
        await queryRunner.query(`ALTER TABLE "product_option_group" ADD "deletedAt" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option" ADD "deletedAt" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "tax_category" ADD "isDefault" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "order_item" ADD "initialListPrice" integer`, undefined);
        
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_69384323444206753f0cdeb64e0"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "lineId" SET NOT NULL`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "order_item"."lineId" IS NULL`, undefined);
        console.log('after handler');
        await queryRunner.query(`COMMENT ON COLUMN "payment_method"."code" IS NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" ALTER COLUMN "code" SET DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_69384323444206753f0cdeb64e0" FOREIGN KEY ("lineId") REFERENCES "order_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_tags_tag" ADD CONSTRAINT "FK_9e412b00d4c6cee1a4b3d920716" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_tags_tag" ADD CONSTRAINT "FK_fb5e800171ffbe9823f2cc727fd" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_channels_channel" ADD CONSTRAINT "FK_dc4e7435f9f5e9e6436bebd33bb" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_channels_channel" ADD CONSTRAINT "FK_16ca9151a5153f1169da5b7b7e3" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_channels_channel" ADD CONSTRAINT "FK_ca796020c6d097e251e5d6d2b02" FOREIGN KEY ("facetId") REFERENCES "facet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_channels_channel" ADD CONSTRAINT "FK_2a8ea404d05bf682516184db7d3" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_channels_channel" ADD CONSTRAINT "FK_ad690c1b05596d7f52e52ffeedd" FOREIGN KEY ("facetValueId") REFERENCES "facet_value"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_channels_channel" ADD CONSTRAINT "FK_e1d54c0b9db3e2eb17faaf5919c" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method_channels_channel" ADD CONSTRAINT "FK_5bcb569635ce5407eb3f264487d" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method_channels_channel" ADD CONSTRAINT "FK_c00e36f667d35031087b382e61b" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        console.log('Adding default channel');
        await addToDefaultChannel(queryRunner, 'asset', 'assetId');
        await addToDefaultChannel(queryRunner, 'facet', 'facetId');
        await addToDefaultChannel(queryRunner, 'facet_value', 'facetValueId');
        await addToDefaultChannel(queryRunner, 'payment_method', 'paymentMethodId');
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "payment_method_channels_channel" DROP CONSTRAINT "FK_c00e36f667d35031087b382e61b"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method_channels_channel" DROP CONSTRAINT "FK_5bcb569635ce5407eb3f264487d"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_channels_channel" DROP CONSTRAINT "FK_e1d54c0b9db3e2eb17faaf5919c"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_channels_channel" DROP CONSTRAINT "FK_ad690c1b05596d7f52e52ffeedd"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_channels_channel" DROP CONSTRAINT "FK_2a8ea404d05bf682516184db7d3"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_channels_channel" DROP CONSTRAINT "FK_ca796020c6d097e251e5d6d2b02"`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_channels_channel" DROP CONSTRAINT "FK_16ca9151a5153f1169da5b7b7e3"`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_channels_channel" DROP CONSTRAINT "FK_dc4e7435f9f5e9e6436bebd33bb"`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_tags_tag" DROP CONSTRAINT "FK_fb5e800171ffbe9823f2cc727fd"`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_tags_tag" DROP CONSTRAINT "FK_9e412b00d4c6cee1a4b3d920716"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_69384323444206753f0cdeb64e0"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" ALTER COLUMN "code" DROP DEFAULT`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "payment_method"."code" IS NULL`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "order_item"."lineId" IS NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "lineId" DROP NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_69384323444206753f0cdeb64e0" FOREIGN KEY ("lineId") REFERENCES "order_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "handler"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "checker"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "description"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "name"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "initialListPrice"`, undefined);
        await queryRunner.query(`ALTER TABLE "tax_category" DROP COLUMN "isDefault"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option" DROP COLUMN "deletedAt"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_group" DROP COLUMN "deletedAt"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" ADD "configArgs" text NOT NULL`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_c00e36f667d35031087b382e61"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_5bcb569635ce5407eb3f264487"`, undefined);
        await queryRunner.query(`DROP TABLE "payment_method_channels_channel"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_e1d54c0b9db3e2eb17faaf5919"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_ad690c1b05596d7f52e52ffeed"`, undefined);
        await queryRunner.query(`DROP TABLE "facet_value_channels_channel"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_2a8ea404d05bf682516184db7d"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_ca796020c6d097e251e5d6d2b0"`, undefined);
        await queryRunner.query(`DROP TABLE "facet_channels_channel"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_16ca9151a5153f1169da5b7b7e"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_dc4e7435f9f5e9e6436bebd33b"`, undefined);
        await queryRunner.query(`DROP TABLE "asset_channels_channel"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_fb5e800171ffbe9823f2cc727f"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_9e412b00d4c6cee1a4b3d92071"`, undefined);
        await queryRunner.query(`DROP TABLE "asset_tags_tag"`, undefined);
        await queryRunner.query(`DROP TABLE "tag"`, undefined);
   }

}
