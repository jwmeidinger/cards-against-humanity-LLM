// src/utils/removeReservedFields.ts

export const removeReservedFields = (data: any): any => {
    if (typeof data === 'object' && data !== null) {
      const { id, ts, coll, ...rest } = data;
      return rest;
    } else {
      return data;
    }
  };
  
  
  