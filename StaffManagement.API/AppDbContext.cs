using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<Role> Roles { get; set; }
    public DbSet<Staff> Staffs { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Task> Tasks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>().ToTable("Role");
        modelBuilder.Entity<Staff>().ToTable("Staff");
        modelBuilder.Entity<Project>().ToTable("Project");
        modelBuilder.Entity<Task>().ToTable("Task");
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseMySql(
            "Server=localhost;Port=3306;Database=StaffManagement;User=root;Password=;",
            ServerVersion.AutoDetect(
                "Server=localhost;Port=3306;Database=StaffManagement;User=root;Password=;"
            )
        );
    }
}