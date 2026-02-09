import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Morocco ICE: 15-digit number
@ValidatorConstraint({ async: false })
class IsICEConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return true; // optional
    return /^\d{15}$/.test(value);
  }
  defaultMessage() {
    return "L'ICE doit contenir exactement 15 chiffres";
  }
}

export function IsICE(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsICEConstraint,
    });
  };
}

// Morocco CIN: 1-2 letters + 5-6 digits
@ValidatorConstraint({ async: false })
class IsCINConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return true;
    return /^[A-Z]{1,2}\d{5,6}$/i.test(value);
  }
  defaultMessage() {
    return 'Le CIN doit etre au format marocain (ex: AB123456)';
  }
}

export function IsCIN(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCINConstraint,
    });
  };
}

// Morocco RC: alphanumeric, typically 6+ chars
@ValidatorConstraint({ async: false })
class IsRCConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return true;
    return /^[A-Z0-9]{4,20}$/i.test(value);
  }
  defaultMessage() {
    return 'Le RC doit contenir entre 4 et 20 caracteres alphanumeriques';
  }
}

export function IsRC(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsRCConstraint,
    });
  };
}

// Morocco phone: +212 followed by 9 digits
@ValidatorConstraint({ async: false })
class IsMoroccoPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return true;
    return /^(\+?212|0)[5-7]\d{8}$/.test(value.replace(/[\s-]/g, ''));
  }
  defaultMessage() {
    return 'Le numero de telephone doit etre au format marocain';
  }
}

export function IsMoroccoPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMoroccoPhoneConstraint,
    });
  };
}
