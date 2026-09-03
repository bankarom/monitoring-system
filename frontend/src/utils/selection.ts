const SELECTED_EMPLOYEE_KEY = 'improx_selected_employee_id';

export function getStoredEmployeeId(): string {
  try {
    return localStorage.getItem(SELECTED_EMPLOYEE_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setStoredEmployeeId(id: string): void {
  try {
    if (id) {
      localStorage.setItem(SELECTED_EMPLOYEE_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_EMPLOYEE_KEY);
    }
  } catch (e) {}
}
