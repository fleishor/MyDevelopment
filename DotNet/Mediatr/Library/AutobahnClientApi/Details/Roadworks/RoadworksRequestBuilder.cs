// <auto-generated/>
#pragma warning disable CS0618
using Bund.API.Autobahn.Client.Details.Roadworks.Item;
using Microsoft.Kiota.Abstractions.Extensions;
using Microsoft.Kiota.Abstractions;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System;
namespace Bund.API.Autobahn.Client.Details.Roadworks
{
    /// <summary>
    /// Builds and executes requests for operations under \details\roadworks
    /// </summary>
    [global::System.CodeDom.Compiler.GeneratedCode("Kiota", "1.18.0")]
    public partial class RoadworksRequestBuilder : BaseRequestBuilder
    {
        /// <summary>Gets an item from the Bund.API.Autobahn.Client.details.roadworks.item collection</summary>
        /// <param name="position">Unique identifier of the item</param>
        /// <returns>A <see cref="global::Bund.API.Autobahn.Client.Details.Roadworks.Item.WithRoadworkItemRequestBuilder"/></returns>
        public global::Bund.API.Autobahn.Client.Details.Roadworks.Item.WithRoadworkItemRequestBuilder this[string position]
        {
            get
            {
                var urlTplParams = new Dictionary<string, object>(PathParameters);
                urlTplParams.Add("roadworkId", position);
                return new global::Bund.API.Autobahn.Client.Details.Roadworks.Item.WithRoadworkItemRequestBuilder(urlTplParams, RequestAdapter);
            }
        }
        /// <summary>
        /// Instantiates a new <see cref="global::Bund.API.Autobahn.Client.Details.Roadworks.RoadworksRequestBuilder"/> and sets the default values.
        /// </summary>
        /// <param name="pathParameters">Path parameters for the request</param>
        /// <param name="requestAdapter">The request adapter to use to execute the requests.</param>
        public RoadworksRequestBuilder(Dictionary<string, object> pathParameters, IRequestAdapter requestAdapter) : base(requestAdapter, "{+baseurl}/details/roadworks", pathParameters)
        {
        }
        /// <summary>
        /// Instantiates a new <see cref="global::Bund.API.Autobahn.Client.Details.Roadworks.RoadworksRequestBuilder"/> and sets the default values.
        /// </summary>
        /// <param name="rawUrl">The raw URL to use for the request builder.</param>
        /// <param name="requestAdapter">The request adapter to use to execute the requests.</param>
        public RoadworksRequestBuilder(string rawUrl, IRequestAdapter requestAdapter) : base(requestAdapter, "{+baseurl}/details/roadworks", rawUrl)
        {
        }
    }
}
#pragma warning restore CS0618
