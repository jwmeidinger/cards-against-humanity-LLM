// netlify/functions/utils/removeReservedFields.ts

export function removeReservedFields(obj: any, isRoot = true): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeReservedFields(item, false));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (isRoot && ['id', 'ts', 'coll'].includes(key)) {
          continue; // Skip reserved fields at the root level
        }
        newObj[key] = removeReservedFields(obj[key], false);
      }
    }
    return newObj;
  }
  return obj;
}
