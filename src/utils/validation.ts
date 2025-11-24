const NAME_REG = /^[\u4e00-\u9fa5_a-zA-Z0-9\s-]{2,32}$/
const DEVICE_CODE_REG = /^[A-Z0-9_-]{4,32}$/
const PHONE_REG = /^1[3-9]\d{9}$/

export const validatePersonName = (name: string) => NAME_REG.test(String(name).trim())
export const validateDeviceCode = (code: string) => DEVICE_CODE_REG.test(String(code).trim())
export const validatePhone = (phone: string) => PHONE_REG.test(String(phone).trim())

export const makeRequiredRule =
  (message: string) =>
  (value: unknown): boolean | string => {
    if (value === null || value === undefined || value === '') {
      return message
    }
    return true
  }

export const personFormRules = {
  name: (value: string) => validatePersonName(value) || '姓名格式不正确',
  phone: (value: string) => (!value || validatePhone(value)) || '手机号格式不正确',
  department: makeRequiredRule('请选择科室')
}

export const deviceFormRules = {
  code: (value: string) => validateDeviceCode(value) || '设备编号格式不正确',
  model: makeRequiredRule('请选择设备型号')
}

export const mappingFormRules = {
  personId: makeRequiredRule('请选择人员'),
  deviceId: makeRequiredRule('请选择设备')
}
