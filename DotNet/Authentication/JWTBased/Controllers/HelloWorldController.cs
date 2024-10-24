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

        [Authorize(Policy = "HelloWorldPolicy")]
        [HttpGet("HelloWorldPolicy")]
        public string HelloWorldPolicy()
        {
            return "Hello World with Policy";
        }

    }
}
