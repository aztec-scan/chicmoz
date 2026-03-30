use ::aztec::macros::aztec;

#[aztec]
contract SimpleLoggingUpdate {
    use ::aztec::{
        macros::{functions::{external, initializer, internal}, storage::storage},
        state_vars::{Map, PublicMutable},
    };
    #[storage]
    struct Storage<Context> {
        counters: Map<Field, PublicMutable<Field, Context>, Context>,
    }

    #[external("public")]
    #[initializer]
    fn constructor() {
    }

    #[internal("public")]
    fn add_to_counter_internal(counter_id: Field) {
        let new_counter_value = self.storage.counters.at(counter_id).read() + 1;
        self.storage.counters.at(counter_id).write(new_counter_value);
    }

    #[internal("public")]
    fn remove_from_counter_internal(counter_id: Field) {
        let new_counter_value = self.storage.counters.at(counter_id).read() - 1;
        self.storage.counters.at(counter_id).write(new_counter_value);
    }

    #[external("public")]
    fn decrease_counter_public(counter_id: Field){
      self.context.emit_public_log(/*message=*/ "pub log");
      self.internal.remove_from_counter_internal(counter_id);
    }

    #[external("public")]
    fn increase_counter_public(counter_id: Field) {
      self.context.emit_public_log(/*message=*/ "pub log");
      self.internal.add_to_counter_internal(counter_id);
    }

    #[external("utility")]
    unconstrained fn get_counter_value(counter_id: Field) -> pub Field {
        self.storage.counters.at(counter_id).read()
    }
}
