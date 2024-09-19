using MediatR;

namespace Library.Interfaces
{
    internal interface IQuery<out TQueryResult> : IRequest<TQueryResult> where TQueryResult : IQueryResult
    {
    }
}
