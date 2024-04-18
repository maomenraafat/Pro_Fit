const deleteUser = async (userId, model) => {
  try {
    const result = await model.findByIdAndDelete(userId);
    if (!result) {
      return { success: false, status: 404, message: "User not found." };
    }
    return {
      success: true,
      status: 200,
      message: "User account deleted successfully.",
    };
  } catch (error) {
    return { success: false, status: 500, message: error.message };
  }
};

export { deleteUser };
