const requests = [];

function createRequest(body) {
  const request = {
    id: requests.length + 1,
    studentId: body.studentId,
    item: body.item,
    status: 'pending',
  };
  requests.push(request);
  return request;
}

function approveRequest(body) {
  const request = requests.find((entry) => entry.id === body.requestId);
  request.status = 'approved';
  return request;
}

function listRequests(query) {
  return requests.filter((entry) => entry.studentId === query.studentId);
}

module.exports = { approveRequest, createRequest, listRequests };

