import {Cloneable} from './Cloneable';
import {TCModelError} from './errors';
import {GVL} from './GVL';

import {ConsentLanguages, IntMap, PurposeRestrictionVector, TCFields, Vector} from './model';
import {GVLMapItem, Purpose} from './model/gvl';

export type TCModelPropType = number | Date | string | boolean | Vector | PurposeRestrictionVector;

export class TCModel extends Cloneable<TCModel> implements TCFields {

  private static readonly MAX_ENCODING_VERSION: number = 2;

  // Defaults
  private version_: number = TCModel.MAX_ENCODING_VERSION;
  private consentScreen_: number | string = 0;
  private policyVersion_: number | string = 2;
  private isServiceSpecific_: boolean = false;
  private useNonStandardStacks_: boolean = false;
  private purposeOneTreatment_: boolean = false;
  private publisherCountryCode_: string = 'AA';
  private supportOOB_: boolean = false;
  private consentLanguage_: string = 'EN';
  private cmpId_: number | string = 0;
  private cmpVersion_: number | string = 0;
  private vendorListVersion_: number | string = 0;

  // Member Variable for GVL
  private gvl_: GVL;

  public created: Date;
  public lastUpdated: Date;

  /**
   * The TCF designates certain Features as special, that is, a CMP must afford
   * the user a means to opt in to their use. These Special Features are
   * published and numbered in the GVL separately from normal Features.
   * Provides for up to 12 special features.
   */
  public readonly specialFeatureOptIns: Vector = new Vector();

  /**
   * Renamed from `PurposesAllowed` in TCF v1.1
   * The user’s consent value for each Purpose established on the legal basis
   * of consent. Purposes are published in the Global Vendor List (see. [[GVL]]).
   */
  public readonly purposeConsents: Vector = new Vector();

  /**
   * The user’s consent value for each Purpose established on the legal basis
   * of consent, for the publisher.  Purposes are published in the Global
   * Vendor List.
   */
  public readonly publisherConsents: Vector = new Vector();

  /**
   * The user’s permission for each Purpose established on the legal basis of
   * legitimate interest. If the user has exercised right-to-object for a
   * purpose.
   */
  public readonly purposeLegitimateInterest: Vector = new Vector();

  /**
   * The user’s permission for each Purpose established on the legal basis of
   * legitimate interest.  If the user has exercised right-to-object for a
   * purpose.
   */
  public readonly publisherLegitimateInterest: Vector = new Vector();

  /**
   * set by a publisher if they wish to collect consent and LI Transparency for
   * purposes outside of the TCF
   */
  public customPurposes: IntMap<Purpose>;

  /**
   * The user’s consent value for each Purpose established on the legal basis
   * of consent, for the publisher.  Purposes are published in the Global
   * Vendor List.
   */
  public readonly publisherCustomConsents: Vector = new Vector();

  /**
   * The user’s permission for each Purpose established on the legal basis of
   * legitimate interest.  If the user has exercised right-to-object for a
   * purpose that is established in the publisher's custom purposes.
   */
  public readonly publisherCustomLegitimateInterest: Vector = new Vector();

  /**
   * Each [[Vendor]] is keyed by id. Their consent value is true if it is in
   * the Vector
   */
  public readonly vendorConsents: Vector = new Vector();

  /**
   * Each [[Vendor]] is keyed by id. Whether their Legitimate Interest
   * Disclosures have been established is stored as boolean.
   * see: [[Vector]]
   */
  public readonly vendorLegitimateInterest: Vector = new Vector();

  /**
   * The value included for disclosed vendors signals which vendors have been
   * disclosed to the user in the interface surfaced by the CMP. This section
   * content is required when writing a TC string to the global (consensu)
   * scope. When a CMP has read from and is updating a TC string from the
   * global consensu.org storage, the CMP MUST retain the existing disclosure
   * information and only add information for vendors that it has disclosed
   * that had not been disclosed by other CMPs in prior interactions with this
   * device/user agent.
   */
  public readonly vendorsDisclosed: Vector = new Vector();

  /**
   * Signals which vendors the publisher permits to use OOB legal bases.
   */
  public readonly vendorsAllowed: Vector = new Vector();

  public readonly publisherRestrictions: PurposeRestrictionVector = new PurposeRestrictionVector();

  /**
   * Set of available consent languages published by the IAB
   */
  public readonly consentLanguages: ConsentLanguages = new ConsentLanguages();

  /**
   * Constructs the TCModel. Passing a [[GVL]] is optional when constructing
   * as this TCModel may be constructed from decoding an existing encoded
   * TCString.
   *
   * @param {GVL} [gvl]
   */
  public constructor(gvl?: GVL) {

    super();

    if (gvl) {

      this.gvl = gvl;

    }

    this.created = new Date();
    this.updated();

  }

  /**
   * sets the [[GVL]] with side effects of also setting the `vendorListVersion`, `policyVersion`, and `consentLanguage`
   * @param {GVL} gvl
   */
  public set gvl(gvl: GVL) {

    /**
     * Set the reference but wait to see the other values for when the data populates
     */
    this.gvl_ = gvl;
    this.publisherRestrictions.gvl = gvl;

    gvl.readyPromise.then((): void => {

      this.vendorListVersion_ = gvl.vendorListVersion;
      this.policyVersion_ = gvl.tcfPolicyVersion;
      this.consentLanguage_ = gvl.language;

    });

  }

  /**
   * @return {GVL} the gvl instance set on this TCModel instance
   */
  public get gvl(): GVL {

    return this.gvl_;

  }

  /**
   * @param {number} integer - A unique ID will be assigned to each Consent
   * Manager Provider (CMP) from the iab.
   *
   * @throws {TCModelError} if the value is not an integer greater than 1 as those are not valid.
   */
  public set cmpId(integer: number | string) {

    if (this.isIntAbove(integer, 1)) {

      this.cmpId_ = integer;

    } else {

      throw new TCModelError('cmpId', integer);

    }

  }

  public get cmpId(): number | string {

    return this.cmpId_;

  }

  /**
   * Each change to an operating CMP should receive a
   * new version number, for logging proof of consent. CmpVersion defined by
   * each CMP.
   *
   * @param {number} integer
   *
   * @throws {TCModelError} if the value is not an integer greater than 1 as those are not valid.
   */
  public set cmpVersion(integer: number | string) {

    if (this.isIntAbove(integer, -1)) {

      this.cmpVersion_ = integer;

    } else {

      throw new TCModelError('cmpVersion', integer);

    }

  }
  public get cmpVersion(): number | string {

    return this.cmpVersion_;

  }

  /**
   * The screen number is CMP and CmpVersion
   * specific, and is for logging proof of consent.(For example, a CMP could
   * keep records so that a publisher can request information about the context
   * in which consent was gathered.)
   *
   * @param {number} integer
   *
   * @throws {TCModelError} if the value is not an integer greater than 0 as those are not valid.
   */
  public set consentScreen(integer: number | string) {

    if (this.isIntAbove(integer, -1)) {

      this.consentScreen_ = integer;

    } else {

      throw new TCModelError('consentScreen', integer);

    }

  }
  public get consentScreen(): number | string {

    return this.consentScreen_;

  }

  /**
   * @param {string} lang - [two-letter ISO 639-1 language
   * code](http://www.loc.gov/standards/iso639-2/php/code_list.php) in which
   * the CMP UI was presented
   *
   * @throws {TCModelError} if the value is not a length-2 string of alpha characters
   */
  public set consentLanguage(lang: string) {

    lang = lang.toUpperCase();

    if (this.consentLanguages.has(lang)) {

      this.consentLanguage_ = lang;

      if (this.gvl && GVL.baseUrl !== undefined) {

        this.gvl.changeLanguage(lang);

      }

    } else {

      throw new TCModelError('consentLanguage', lang);

    }

  }
  public get consentLanguage(): string {

    return this.consentLanguage_;

  }

  /**
   * @param {string} countryCode - [two-letter ISO 3166-1 alpha-2 country
   * code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the publisher,
   * determined by the CMP-settings of the publisher.
   *
   * @throws {TCModelError} if the value is not a length-2 string of alpha characters
   */
  public set publisherCountryCode(countryCode: string) {

    if (/^([A-z]){2}$/.test(countryCode)) {

      this.publisherCountryCode_ = countryCode.toUpperCase();

    } else {

      throw new TCModelError('publisherCountryCode', countryCode);

    }

  }
  public get publisherCountryCode(): string {

    return this.publisherCountryCode_;

  }

  /**
   * Version of the GVL used to create this TCModel. Global
   * Vendor List versions will be released periodically.
   *
   * @param {number} integer
   *
   * @throws {TCModelError} if the value is not an integer greater than 0 as those are not valid.
   */
  public set vendorListVersion(integer: number | string) {

    if (this.isIntAbove(integer, 0)) {

      if (typeof integer === 'string') {

        integer = parseInt(integer, 10);

      }

      if (!this.gvl) {

        this.vendorListVersion_ = integer;

      } else if (this.gvl.vendorListVersion !== integer) {

        this.gvl = new GVL(integer);

      }

    } else {

      throw new TCModelError('vendorListVersion', integer);

    }

  }

  public get vendorListVersion(): number | string {

    return this.vendorListVersion_;

  }

  /**
   * From the corresponding field in the GVL that was
   * used for obtaining consent. A new policy version invalidates existing
   * strings and requires CMPs to re-establish transparency and consent from
   * users.
   *
   * If a TCF policy version number is different from the one from the latest
   * GVL, the CMP must re-establish transparency and consent.
   *
   * @param {number} num - You do not need to set this.  This comes
   * directly from the [[GVL]].
   *
   * @throws {TCModelError} if the value is not an integer greater than 1 as those are not valid.
   */
  public set policyVersion(num: number | string) {

    if (this.isIntAbove(num, 1)) {

      this.policyVersion_ = num;

    } else {

      throw new TCModelError('policyVersion', num);

    }

  }
  public get policyVersion(): number | string {

    return this.policyVersion_;

  }

  /**
   * Incremented when TC String format changes. Indicates
   * what encoding format the TCString will follow v1 or v2.  v1 fields will
   * omit fields.
   *
   * @param {number} num
   *
   * @throws {TCModelError} if the value is not either 1 or 2
   */
  public set version(num: number) {

    if (this.isIntAbove(num, 0) && num <= TCModel.MAX_ENCODING_VERSION) {

      this.version_ = num;

    } else {

      throw new TCModelError('version', num, `max version is ${TCModel.MAX_ENCODING_VERSION}, can't be higher`);

    }

  }
  public get version(): number {

    return this.version_;

  }

  /**
   * Whether the signals encoded in this TC String were from site-specific
   * storage `true` versus ‘global’ consensu.org shared storage `false`. A
   * string intended to be stored in global/shared scope but the CMP is unable
   * to store due to a user agent not accepting third-party cookies would be
   * considered site-specific `true`.
   *
   * @param {boolean} bool - value to set. Some changes to other fields in this
   * model will automatically change this value like adding publisher
   * restrictions.
   */
  public set isServiceSpecific(bool: boolean) {

    this.isServiceSpecific_ = bool;

  };
  public get isServiceSpecific(): boolean {

    return this.isServiceSpecific_;

  };

  /**
   * Non-standard stacks means that a CMP is using publisher-customized stack
   * descriptions. Stacks (in terms of purposes in a stack) are pre-set by the
   * IAB. As are titles. Descriptions are pre-set, but publishers can customize
   * them. If they do, they need to set this bit to indicate that they've
   * customized descriptions.
   *
   * @param {boolean} bool - value to set
   */
  public set useNonStandardStacks(bool: boolean) {

    this.useNonStandardStacks_ = bool;

  };
  public get useNonStandardStacks(): boolean {

    return this.useNonStandardStacks_;

  };

  /**
   * Whether or not this publisher supports out-of-band legal basis default is
   * `true`
   *
   * @param {boolean} bool - value to set
   */
  public set supportOOB(bool: boolean) {

    this.supportOOB_ = bool;

  };
  public get supportOOB(): boolean {

    return this.supportOOB_;

  };

  /**
   * `false` There is no special Purpose 1 status.
   * Purpose 1 was disclosed normally (consent) as expected by Policy.  `true`
   * Purpose 1 not disclosed at all. CMPs use PublisherCC to indicate the
   * publisher’s country of establishment to help Vendors determine whether the
   * vendor requires Purpose 1 consent. In global scope TC strings, this field
   * must always have a value of `false`. When a CMP encounters a global scope
   * string with `purposeOneTreatment=true` then that string should be
   * considered invalid and the CMP must re-establish transparency and consent.
   *
   * @param {boolean} bool
   */
  public set purposeOneTreatment(bool: boolean) {

    this.purposeOneTreatment_ = bool;

  };
  public get purposeOneTreatment(): boolean {

    return this.purposeOneTreatment_;

  };

  /**
   * Sets all items on the vector
   *
   * @param {IntMap<T>} gvlMap - this will be one of the maps defined in the [[IntMap]]
   * @param {Vector} vector - vector to affect
   * @return {void}
   */
  private setAllOnVector<T>(gvlMap: IntMap<T>, vector: Vector): void {

    if (!this.gvl) {

      throw new TCModelError('setAll', '' + this.gvl, 'No GVL!');

    }

    for (const id in gvlMap) {

      if (gvlMap.hasOwnProperty(id)) {

        const pathItem = gvlMap[id];

        if (this.isGVLMapItem(pathItem)) {

          vector.set(pathItem.id);

        }

      }

    }

  }

  /**
   * setAllVendorConsents - sets all vendors on the GVL Consent (true)
   *
   * @return {void}
   */
  public setAllVendorConsents(): void {

    this.vendorConsents.empty();
    this.setAllOnVector(this.gvl.vendors, this.vendorConsents);

  }

  /**
   * unsetAllVendorConsents - unsets all vendors on the GVL Consent (false)
   *
   * @return {void}
   */
  public unsetAllVendorConsents(): void {

    this.vendorConsents.empty();

  }

  /**
   * setAllVendorsDisclosed - sets all vendors on the GVL Consent (true)
   *
   * @return {void}
   */
  public setAllVendorsDisclosed(): void {

    this.vendorsDisclosed.empty();
    this.setAllOnVector(this.gvl.vendors, this.vendorsDisclosed);

  }

  /**
   * unsetAllVendorsDisclosed - unsets all vendors on the GVL Consent (false)
   *
   * @return {void}
   */
  public unsetAllVendorsDisclosed(): void {

    this.vendorsDisclosed.empty();

  }

  /**
   * setAllVendorLegitimateInterest - sets all vendors on the GVL LegitimateInterest (true)
   *
   * @return {void}
   */
  public setAllVendorLegitimateInterest(): void {

    this.vendorLegitimateInterest.empty();
    this.setAllOnVector(this.gvl.vendors, this.vendorLegitimateInterest);

  }

  /**
   * unsetAllVendorLegitimateInterest - unsets all vendors on the GVL LegitimateInterest (false)
   *
   * @return {void}
   */
  public unsetAllVendorLegitimateInterest(): void {

    this.vendorLegitimateInterest.empty();

  }

  /**
   * setAllPurposeConsents - sets all purposes on the GVL Consent (true)
   *
   * @return {void}
   */
  public setAllPurposeConsents(): void {

    this.purposeConsents.empty();
    this.setAllOnVector(this.gvl.purposes, this.purposeConsents);

  }

  /**
   * unsetAllPurposeConsents - unsets all purposes on the GVL Consent (false)
   *
   * @return {void}
   */
  public unsetAllPurposeConsents(): void {

    this.purposeConsents.empty();

  }

  /**
   * setAllPurposeLegitimateInterest - sets all purposes on the GVL LI Transparency (true)
   *
   * @return {void}
   */
  public setAllPurposeLegitimateInterest(): void {

    this.purposeLegitimateInterest.empty();
    this.setAllOnVector(this.gvl.purposes, this.purposeLegitimateInterest);

  }

  /**
   * unsetAllPurposeLegitimateInterest - unsets all purposes on the GVL LI Transparency (false)
   *
   * @return {void}
   */
  public unsetAllPurposeLegitimateInterest(): void {

    this.purposeLegitimateInterest.empty();

  }

  /**
   * setAllSpecialFeatureOptIns - sets all special featuresOptins on the GVL (true)
   *
   * @return {void}
   */
  public setAllSpecialFeatureOptIns(): void {

    this.specialFeatureOptIns.empty();
    this.setAllOnVector(this.gvl.specialFeatures, this.specialFeatureOptIns);

  }

  /**
   * unsetAllSpecialFeatureOptIns - unsets all special featuresOptins on the GVL (true)
   *
   * @return {void}
   */
  public unsetAllSpecialFeatureOptIns(): void {

    this.specialFeatureOptIns.empty();

  }

  /**
   * setAll - calls:
   * ```
    setAllVendorConsents();
    setAllPurposeLegitimateInterest();
    setAllSpecialFeatureOptIns();
    setAllPurposeConsents();
    setAllVendorLegitimateInterest();
    setAllVendorsDisclosed();
   * ```
   * @return {void}
   */
  public setAll(): void {

    this.setAllVendorConsents();
    this.setAllPurposeLegitimateInterest();
    this.setAllSpecialFeatureOptIns();
    this.setAllPurposeConsents();
    this.setAllVendorLegitimateInterest();
    this.setAllVendorsDisclosed();

  }

  /**
   * unsetAll - calls:
   * ```
    unsetAllVendorConsents();
    unsetAllPurposeLegitimateInterest();
    unsetAllSpecialFeatureOptIns();
    unsetAllPurposeConsents();
    unsetAllVendorLegitimateInterest();
    unsetAllVendorsDisclosed();
   * ```
   * @return {void}
   */
  public unsetAll(): void {

    this.unsetAllVendorConsents();
    this.unsetAllPurposeLegitimateInterest();
    this.unsetAllSpecialFeatureOptIns();
    this.unsetAllPurposeConsents();
    this.unsetAllVendorLegitimateInterest();
    this.unsetAllVendorsDisclosed();

  }

  public get numCustomPurposes(): number {

    let len = 0;

    if (this.customPurposes) {

      len = Object.keys(this.customPurposes).length;

    }

    return len;

  }
  public set numCustomPurposes(num: number) {

    if (!this.customPurposes) {

      this.customPurposes = {};

      for (let i = 0; i < num; i++) {

        const id: string = (i + 1).toString();

        this.customPurposes[id] = {
          id: i+1,
          name: `publisher purpose ${id}`,
          description: `publisher purpose description${id}`,
          descriptionLegal: `publisher purpose legal description ${id}`,
        };

      }

    }

  }

  /**
   * isIntAbove - private method for validating that a passed in value is both
   * an int and above a certain number
   *
   * @param {number | string} possibleInt - value to check
   * @param {number} above - the lower limit
   * @return{boolean} - whether or not `possibleInt` is both an int and above `above` number
   */
  private isIntAbove(possibleInt: number | string, above: number): boolean {

    if (typeof possibleInt === 'string') {

      possibleInt = parseInt(possibleInt, 10);

    }

    return (Number.isInteger(possibleInt) && possibleInt > above);

  }

  /**
   * This is a type check I need it to be an 'any'
   * @param {any} obj
   * @return {boolean}
   */
  // eslint-disable-next-line
  private isGVLMapItem(obj: any): obj is GVLMapItem {

    return typeof obj.id === 'number' && typeof obj.name === 'string';

  }

  /**
   * updated - updates the lastUpdatedDate with a 'now' timestamp
   *
   * @return {void}
   */
  public updated(): void {

    this.lastUpdated = new Date();

  }
}
