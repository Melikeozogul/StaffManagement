using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StaffManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentTypeAndAmountToStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaymentAmount",
                table: "Staff",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentType",
                table: "Staff",
                type: "varchar(20)",
                nullable: false,
                defaultValue: "Hourly")
                .Annotation("MySql:CharSet", "utf8mb4");

            // Migrate existing staff records: preserve existing rate as Hourly PaymentAmount
            migrationBuilder.Sql("UPDATE Staff SET PaymentType = 'Hourly', PaymentAmount = COALESCE(HourlyRate, HourlyWage, 0);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentAmount",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "PaymentType",
                table: "Staff");
        }
    }
}
