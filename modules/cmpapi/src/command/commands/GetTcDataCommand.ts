import {CmpDataReader} from '../../cmpdata';
import {Param, TCDataCallback} from '../../types';
import {Validatable, ValidationMessages, ValidationResult} from '../../validation';
import {Callback} from '../callback/Callback';
import {TCDataBldr} from '../responsebuilders';
import {BaseCommand} from './BaseCommand';
import {Command} from './Command';

export class GetTcDataCommand extends BaseCommand implements Command, Validatable {

  public constructor(cmpData: CmpDataReader, command: string, version: number, callback: Callback, param?: Param) {

    super(cmpData, command, version, callback, param);

  }

  /**
   * Executes the get tc data command
   */
  public execute(): void {

    const tcData = new TCDataBldr(this.cmpData.getTcModel(), this.cmpData.getEventStatus(), this.param as number[]);
    this.setBaseReturnFields(tcData);
    (this.callback.function as TCDataCallback)(tcData.buildResponse(), true);

  }

  /**
   * Validates the vendor list was valid and returns the result.
   * Base class validation is also handled.
   * @param {boolean} failCallbackIfNotValid
   * @return {ValidationResult}
   */
  public validate(failCallbackIfNotValid: boolean = false): ValidationResult {

    const validationResult = super.validate(failCallbackIfNotValid);

    if (!this.isVendorsListValid()) {

      validationResult.validationMessages.push(ValidationMessages.VENDOR_LIST_INVALID);
      validationResult.isValid = false;

      if (failCallbackIfNotValid) {

        this.callback.fail(validationResult.validationMessages);

      }

    }

    return validationResult;

  }

}
