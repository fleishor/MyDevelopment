using MediatR;

namespace Library.Interfaces
{
    internal interface IQueryHandler<in TQueryArguments, TQueryResult> :
        IRequestHandler<TQueryArguments, TQueryResult>
        where TQueryArguments : IQuery<IQueryResult>, IRequest<TQueryResult>
    {
    }
}