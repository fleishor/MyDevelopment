
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace CookieBased
{
    public class Program
    {
        public static string AuthenticationScheme = "cookie";

        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddHttpContextAccessor();

            // Add services to the container.

            // Add Cookie Authorization
            builder.Services.AddAuthentication(AuthenticationScheme)
                .AddCookie(AuthenticationScheme, options =>
                {
                    options.Cookie.Name = "MyAuthCookie";
                    options.Events.OnRedirectToAccessDenied = f =>
                    {
                        f.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    };
                    options.Events.OnRedirectToLogin = f =>
                    {
                        f.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    };
                });

            // Add Authorization Policy which can be used in AuthorizeAttribute
            builder.Services.AddAuthorization(policyBuilder =>
            {
                policyBuilder.AddPolicy("HelloWorldPolicy", policy =>
                {
                    policy.RequireAuthenticatedUser()
                        .AddAuthenticationSchemes(AuthenticationScheme)
                        .RequireRole("HelloWorldRole");
                });
            });

            builder.Services.AddControllers();

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseStaticFiles();

            app.MapControllers();

            app.Run();
        }
    }
}
