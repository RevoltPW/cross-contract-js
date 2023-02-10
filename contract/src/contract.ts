
import { NearBindgen, call, near, LookupSet, UnorderedMap, Vector, initialize, bytes, NearPromise } from "near-sdk-js";
import { AccountId, PublicKey } from "near-sdk-js/lib/types";

const FIVE_TGAS = BigInt("50000000000000");
const NO_DEPOSIT = BigInt(0);
const NO_ARGS = JSON.stringify({});
const MIN_STORAGE: bigint = BigInt("1820000000000000000000"); //0.00182Ⓝ
const CALL_GAS: bigint = BigInt("28000000000000");

//To make the initialization mandatory use @NearBindgen({requireInit: true})
@NearBindgen({requireInit: true})
class CrossContractCall {
  hello_account: AccountId = "hello-nearverse.testnet";
  accountsCreated = new UnorderedMap<bigint>('map-uid-1');


  @initialize({privateFunction: true})
  init({ hello_account }: { hello_account: AccountId }) {
    this.hello_account = hello_account
  }

  @call({})
  create_account({account_id, public_key}:{account_id: String, public_key: String}) {
 
    const promise = NearPromise.new("testnet")
    .functionCall("create_account", JSON.stringify({"new_account_id": account_id,"new_public_key": public_key  }), MIN_STORAGE, CALL_GAS)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("query_create_account", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    );
    
    return promise.asReturn();
  }

  @call({privateFunction: true})
  query_create_account(): String {
    let {result, success} = promiseResult()

    if (success) {
      return result.substring(1, result.length-1);
    } else {
      near.log("Promise failed...")
      return ""
    }
  }

  @call({payableFunction:true})
  create_subaccount({prefix, public_key}:{prefix: String, public_key: PublicKey}) {
    const account_id = `${prefix}.${near.currentAccountId()}`

    const promise = NearPromise.new(account_id)
    .createAccount()
    .transfer(MIN_STORAGE)
    .addFullAccessKey(public_key)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("query_create_subaccount", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    );
    
    return promise.asReturn();
    //console.log(public_key)
    //add_access_key: adds a key that can only call specific methods on a specified contract.
    //add_full_access_key: adds a key that has full access to the account.
  }
  @call({privateFunction: true})
  query_create_subaccount(): String {
    let {result, success} = promiseResult()

    if (success) {
      return result.substring(1, result.length-1);
    } else {
      near.log("Promise failed...")
      return ""
    }
  }
  
  @call({})
  query_greeting(): NearPromise {
    const promise = NearPromise.new(this.hello_account)
    .functionCall("get_greeting", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("query_greeting_callback", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    )
    
    return promise.asReturn();
  }

  @call({privateFunction: true})
  query_greeting_callback(): String {
    let {result, success} = promiseResult()

    if (success) {
      return result.substring(1, result.length-1);
    } else {
      near.log("Promise failed...")
      return ""
    }
  }

  @call({})
  change_greeting({ new_greeting }: { new_greeting: string }): NearPromise {
    const promise = NearPromise.new(this.hello_account)
    .functionCall("set_greeting", JSON.stringify({ greeting: new_greeting }), NO_DEPOSIT, FIVE_TGAS)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("change_greeting_callback", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    )

    return promise.asReturn();
  }

  @call({privateFunction: true})
  change_greeting_callback(): boolean {
    let { success } = promiseResult()
//Checking Execution Status
    if (success) {
      near.log(`Success!`)
      return true
    } else {
      near.log("Promise failed...")
      return false
    }
  }
}

function promiseResult(): {result: string, success: boolean}{
  let result, success;
  
  try{ result = near.promiseResult(0); success = true }
  catch{ result = undefined; success = false }
  
  return {result, success}
}