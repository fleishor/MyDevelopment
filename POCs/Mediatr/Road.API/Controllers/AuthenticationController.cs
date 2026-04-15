namespace Road.API.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
public class AuthenticationController(IHttpContextAccessor ctx) : ControllerBase
{
    [HttpGet("SignIn")]
    public async Task<string> SignIn()
    {
        var claims = new List<Claim>() { new("user", "fleishor") };
        var identity = new ClaimsIdentity(claims, "cookie");
        var user = new ClaimsPrincipal(identity);
        if (ctx.HttpContext != null)
        {
            await ctx.HttpContext.SignInAsync("cookie", user);
        }

        return "ok";
    }

    [HttpGet("GetIdentity")]
    public string? GetIdentity()
    {
        if (ctx.HttpContext != null)
        {
            return ctx.HttpContext.User.Claims.ToList().ToString();
        }

        return string.Empty;
    }
}
