import { asyncHandler } from "../middleware/asyncHandler.js";

export function createObligationController(service, label) {
  const list = asyncHandler(async (req, res) => {
    const items = await service.list({ search: req.query.search });
    res.json({ success: true, data: { items } });
  });

  const getOne = asyncHandler(async (req, res) => {
    const item = await service.getById(req.params.id);
    res.json({ success: true, data: item });
  });

  const create = asyncHandler(async (req, res) => {
    const item = await service.create(req.body);
    res.status(201).json({
      success: true,
      message: `${label} added.`,
      data: item,
    });
  });

  const update = asyncHandler(async (req, res) => {
    const item = await service.update(req.params.id, req.body);
    res.json({
      success: true,
      message: `${label} updated.`,
      data: item,
    });
  });

  const remove = asyncHandler(async (req, res) => {
    await service.remove(req.params.id);
    res.json({
      success: true,
      message: `${label} moved to trash.`,
    });
  });

  const addPayment = asyncHandler(async (req, res) => {
    const item = await service.addPayment(req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: "Payment recorded.",
      data: item,
    });
  });

  const deletePayment = asyncHandler(async (req, res) => {
    const item = await service.deletePayment(req.params.id, req.params.paymentId);
    res.json({
      success: true,
      message: "Payment moved to trash.",
      data: item,
    });
  });

  const personHistory = asyncHandler(async (req, res) => {
    const data = await service.getPersonHistory(req.params.name);
    res.json({ success: true, data });
  });

  return {
    list,
    getOne,
    create,
    update,
    remove,
    addPayment,
    deletePayment,
    personHistory,
  };
}
