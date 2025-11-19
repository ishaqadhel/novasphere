class BaseService {
  constructor() {
    if (new.target === BaseService) {
      throw new Error('Cannot instantiate abstract class BaseService directly');
    }
  }

  handleError(error, customMessage = 'Service error occurred') {
    console.error(`${customMessage}:`, error.message);
    throw new Error(customMessage);
  }

  validateRequired(data, requiredFields) {
    const missingFields = [];

    for (const field of requiredFields) {
      if (!data[field] || data[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return true;
  }
}

export default BaseService;
