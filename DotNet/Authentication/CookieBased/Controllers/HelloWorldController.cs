using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CookieBased.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HelloWorldController : ControllerBase
    {
        [HttpGet("HelloWorldInsecure")]
        public string HelloWorldInsecure()
        {
            return "Hello World (Insecure)";
        }

        [Authorize(Roles = "HelloWorldRoleAdmin")]
        [HttpGet("HelloWorldRoleAdmin")]
        public string HelloWorldRolesAdmin()
        {
            return "Hello World with Role Admin";
        }

        [Authorize(Roles = "HelloWorldRole")]
        [HttpGet("HelloWorldRoles")]
        public string HelloWorldRoles()
        {
            return "Hello World with Roles";
        }

        [Authorize(Policy = "HelloWorldPolicy")]
        [HttpGet("HelloWorldPolicy")]
        public string HelloWorldPolicy()
        {
            return "Hello World with Policy";
        }

    }
}
