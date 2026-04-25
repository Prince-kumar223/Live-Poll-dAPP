#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Map, String,
    Symbol, Vec,
};

const QUESTION_KEY: Symbol = symbol_short!("QUESTION");
const OPTIONS_KEY: Symbol = symbol_short!("OPTIONS");
const VOTES_KEY: Symbol = symbol_short!("VOTES");
const FEEDBACK_KEY: Symbol = symbol_short!("FEEDBACK");
const STATE_TTL_THRESHOLD: u32 = 5_000;
const STATE_TTL_BUMP: u32 = 100_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    NotInitialized = 1,
    AlreadyVoted = 2,
    InvalidOption = 3,
    AlreadyInitialized = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteEvent {
    pub voter: Address,
    pub option_index: u32,
}

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    pub fn init(env: Env, question: String, options: Vec<String>) -> Result<(), ContractError> {
        if env.storage().instance().has(&QUESTION_KEY) {
            return Err(ContractError::AlreadyInitialized);
        }

        if options.len() != 2 {
            return Err(ContractError::InvalidOption);
        }

        let votes = Map::<Address, u32>::new(&env);
        let feedback = Vec::<String>::new(&env);

        env.storage().instance().set(&QUESTION_KEY, &question);
        env.storage().instance().set(&OPTIONS_KEY, &options);
        env.storage().instance().set(&VOTES_KEY, &votes);
        env.storage().instance().set(&FEEDBACK_KEY, &feedback);
        bump_state_ttl(&env);

        Ok(())
    }

    pub fn vote(env: Env, voter: Address, option_index: u32) -> Result<(), ContractError> {
        voter.require_auth();

        ensure_initialized(&env)?;

        let options = get_options_internal(&env)?;
        if option_index >= options.len() {
            return Err(ContractError::InvalidOption);
        }

        let mut votes = get_votes_internal(&env)?;
        if votes.contains_key(voter.clone()) {
            return Err(ContractError::AlreadyVoted);
        }

        votes.set(voter.clone(), option_index);
        env.storage().instance().set(&VOTES_KEY, &votes);
        env.events()
            .publish((symbol_short!("vote"),), VoteEvent { voter, option_index });
        bump_state_ttl(&env);

        Ok(())
    }

    pub fn get_results(env: Env) -> Result<Map<u32, u32>, ContractError> {
        ensure_initialized(&env)?;

        let options = get_options_internal(&env)?;
        let votes = get_votes_internal(&env)?;
        let mut tallies = Map::<u32, u32>::new(&env);

        for option_index in 0..options.len() {
            tallies.set(option_index, 0);
        }

        for (_, selected_index) in votes.iter() {
            let current = tallies.get(selected_index).unwrap_or(0);
            tallies.set(selected_index, current + 1);
        }

        bump_state_ttl(&env);
        Ok(tallies)
    }

    pub fn has_voted(env: Env, voter: Address) -> Result<bool, ContractError> {
        ensure_initialized(&env)?;
        let votes = get_votes_internal(&env)?;
        bump_state_ttl(&env);
        Ok(votes.contains_key(voter))
    }

    pub fn get_question(env: Env) -> Result<String, ContractError> {
        ensure_initialized(&env)?;
        bump_state_ttl(&env);
        Ok(env.storage().instance().get(&QUESTION_KEY).unwrap())
    }

    pub fn get_options(env: Env) -> Result<Vec<String>, ContractError> {
        ensure_initialized(&env)?;
        let options = get_options_internal(&env)?;
        bump_state_ttl(&env);
        Ok(options)
    }

    pub fn send_feedback(env: Env, feedback_msg: String) -> Result<(), ContractError> {
        ensure_initialized(&env)?;

        let mut feedback = get_feedback_internal(&env)?;
        feedback.push_back(feedback_msg);
        env.storage().instance().set(&FEEDBACK_KEY, &feedback);
        bump_state_ttl(&env);

        Ok(())
    }

    pub fn fetch_feedback(env: Env) -> Result<Vec<String>, ContractError> {
        ensure_initialized(&env)?;
        let feedback = get_feedback_internal(&env)?;
        bump_state_ttl(&env);
        Ok(feedback)
    }
}

fn ensure_initialized(env: &Env) -> Result<(), ContractError> {
    if !env.storage().instance().has(&QUESTION_KEY) {
        return Err(ContractError::NotInitialized);
    }

    Ok(())
}

fn get_votes_internal(env: &Env) -> Result<Map<Address, u32>, ContractError> {
    env.storage()
        .instance()
        .get(&VOTES_KEY)
        .ok_or(ContractError::NotInitialized)
}

fn get_options_internal(env: &Env) -> Result<Vec<String>, ContractError> {
    env.storage()
        .instance()
        .get(&OPTIONS_KEY)
        .ok_or(ContractError::NotInitialized)
}

fn get_feedback_internal(env: &Env) -> Result<Vec<String>, ContractError> {
    env.storage()
        .instance()
        .get(&FEEDBACK_KEY)
        .ok_or(ContractError::NotInitialized)
}

fn bump_state_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(STATE_TTL_THRESHOLD, STATE_TTL_BUMP);
}
