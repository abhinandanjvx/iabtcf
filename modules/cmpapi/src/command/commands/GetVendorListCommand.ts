import {GVL} from '@iabtcf/core';
import {CmpDataReader} from '../../cmpdata';
import {Param, VendorListCallback} from '../../types';
import {Validatable, ValidationMessages, ValidationResult} from '../../validation';
import {Callback} from '../callback/Callback';
import {GlobalVendorListBldr} from '../responsebuilders';
import {BaseCommand} from './BaseCommand';
import {Command} from './Command';

/**
 * Gets a version of the Global Vendors List
 */
export class GetVendorListCommand extends BaseCommand implements Command, Validatable {

  public constructor(cmpData: CmpDataReader, command: string, version: number, callback: Callback, param?: Param) {

    super(cmpData, command, version, callback, param);

  }

  /**
   * Executes the get vendors list command
   */
  public execute(): void {

    /**
     * Return a clone of the current GVL if no param/version was used. Otherwise, create a new GVL with the
     * specific version.
     */

    const _gvl: GVL = this.param ? new GVL(this.param as string | number) : this.cmpData.getTcModel().gvl.clone();

    _gvl.readyPromise.then(() => {

      const gvl = new GlobalVendorListBldr(_gvl);
      this.setBaseReturnFields(gvl);

      (this.callback.function as VendorListCallback)(gvl.buildResponse(), true);

    }, ((reason) => this.callback.fail(reason))).catch((reason) => this.callback.fail(reason));

  }

  /**
   * Validates the vendor list version was valid and returns the result.
   * Base class validation is also handled.
   * @param {boolean} failCallbackIfNotValid
   * @return {ValidationResult}
   */
  public validate(failCallbackIfNotValid: boolean = false): ValidationResult {

    const validationResult = super.validate(failCallbackIfNotValid);

    if (!this.isValidVendorListVersion()) {

      validationResult.validationMessages.push(ValidationMessages.VENDOR_LIST_VERSION_INVALID);
      validationResult.isValid = false;

      if (failCallbackIfNotValid) {

        this.callback.fail(validationResult.validationMessages);

      }

    }

    return validationResult;

  }

}
