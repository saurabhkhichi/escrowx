#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec,
};

#[contracttype]
pub enum DataKey {
    Config,
    Job(u64),
    JobCounter,
    FreelancerStats(Address),
    Milestone(u64, u32),
    JobApplications(u64),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Config {
    pub admin: Address,
    pub job_counter: u64,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum JobStatus {
    Open,
    InProgress,
    Completed,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Job {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub title: String,
    pub description: String,
    pub budget: i128,
    pub status: JobStatus,
    pub milestone_count: u32,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Milestone {
    pub job_id: u64,
    pub index: u32,
    pub title: String,
    pub amount: i128,
    pub deliverable: String,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct FreelancerStats {
    pub completed_jobs: u32,
    pub total_earned: i128,
    pub rating_sum: u32,
    pub rating_count: u32,
}

#[contract]
pub struct FreelanceMarketplace;

#[contractimpl]
impl FreelanceMarketplace {
    pub fn initialize(env: Env, admin: Address) {
        let config = Config {
            admin,
            job_counter: 0,
        };
        env.storage().instance().set(&DataKey::Config, &config);
    }

    pub fn create_job(
        env: Env,
        client: Address,
        title: String,
        description: String,
        budget: i128,
    ) -> u64 {
        client.require_auth();
        let mut config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        config.job_counter += 1;
        let id = config.job_counter;
        env.storage().instance().set(&DataKey::Config, &config);

        let job = Job {
            id,
            client: client.clone(),
            freelancer: client.clone(),
            title: title.clone(),
            description,
            budget,
            status: JobStatus::Open,
            milestone_count: 0,
            created_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Job(id), &job);
        env.storage()
            .persistent()
            .set(&DataKey::JobApplications(id), &Vec::<Address>::new(&env));

        env.events().publish(
            (Symbol::new(&env, "j_created"),),
            (id, client, title, budget),
        );
        id
    }

    pub fn apply_for_job(env: Env, freelancer: Address, job_id: u64) {
        freelancer.require_auth();
        let job: Job = env.storage().persistent().get(&DataKey::Job(job_id)).unwrap();
        assert!(job.status == JobStatus::Open, "job not open");

        let mut apps: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::JobApplications(job_id))
            .unwrap();
        assert!(!apps.contains(freelancer.clone()), "already applied");
        apps.push_back(freelancer.clone());
        env.storage()
            .persistent()
            .set(&DataKey::JobApplications(job_id), &apps);

        env.events()
            .publish((symbol_short!("j_apply"),), (job_id, freelancer));
    }

    pub fn assign_freelancer(env: Env, client: Address, job_id: u64, freelancer: Address) {
        client.require_auth();
        let mut job: Job = env.storage().persistent().get(&DataKey::Job(job_id)).unwrap();
        assert!(job.client == client, "not your job");
        assert!(job.status == JobStatus::Open, "job not open");

        let apps: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::JobApplications(job_id))
            .unwrap();
        assert!(apps.contains(freelancer.clone()), "freelancer not applied");

        job.freelancer = freelancer.clone();
        job.status = JobStatus::InProgress;
        env.storage().persistent().set(&DataKey::Job(job_id), &job);

        env.events()
            .publish((Symbol::new(&env, "j_assign"),), (job_id, freelancer));
    }

    pub fn add_milestone(env: Env, client: Address, job_id: u64, title: String, amount: i128) {
        client.require_auth();
        let mut job: Job = env.storage().persistent().get(&DataKey::Job(job_id)).unwrap();
        assert!(job.client == client, "not your job");

        let index = job.milestone_count;
        let milestone = Milestone {
            job_id,
            index,
            title,
            amount,
            deliverable: String::from_str(&env, ""),
            status: MilestoneStatus::Pending,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Milestone(job_id, index), &milestone);

        job.milestone_count += 1;
        env.storage().persistent().set(&DataKey::Job(job_id), &job);

        env.events()
            .publish((symbol_short!("ms_add"),), (job_id, index, amount));
    }

    pub fn submit_milestone(
        env: Env,
        freelancer: Address,
        job_id: u64,
        index: u32,
        deliverable: String,
    ) {
        freelancer.require_auth();
        let job: Job = env.storage().persistent().get(&DataKey::Job(job_id)).unwrap();
        assert!(job.freelancer == freelancer, "not assigned");
        assert!(job.status == JobStatus::InProgress, "job not in progress");

        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&DataKey::Milestone(job_id, index))
            .unwrap();
        assert!(ms.status == MilestoneStatus::Pending, "not pending");

        ms.deliverable = deliverable;
        ms.status = MilestoneStatus::Submitted;
        env.storage()
            .persistent()
            .set(&DataKey::Milestone(job_id, index), &ms);

        env.events()
            .publish((symbol_short!("ms_sub"),), (job_id, index, freelancer));
    }

    pub fn approve_milestone(env: Env, client: Address, job_id: u64, index: u32) {
        client.require_auth();
        let mut job: Job = env.storage().persistent().get(&DataKey::Job(job_id)).unwrap();
        assert!(job.client == client, "not your job");

        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&DataKey::Milestone(job_id, index))
            .unwrap();
        assert!(ms.status == MilestoneStatus::Submitted, "not submitted");

        ms.status = MilestoneStatus::Approved;
        env.storage()
            .persistent()
            .set(&DataKey::Milestone(job_id, index), &ms);

        // Check if all milestones approved
        let mut all_done = true;
        let mut i = 0;
        while i < job.milestone_count {
            let m: Milestone = env
                .storage()
                .persistent()
                .get(&DataKey::Milestone(job_id, i))
                .unwrap();
            if m.status != MilestoneStatus::Approved {
                all_done = false;
                break;
            }
            i += 1;
        }

        if all_done {
            job.status = JobStatus::Completed;
            env.storage().persistent().set(&DataKey::Job(job_id), &job);

            let mut stats: FreelancerStats = env
                .storage()
                .persistent()
                .get(&DataKey::FreelancerStats(job.freelancer.clone()))
                .unwrap_or(FreelancerStats {
                    completed_jobs: 0,
                    total_earned: 0,
                    rating_sum: 0,
                    rating_count: 0,
                });
            stats.completed_jobs += 1;
            stats.total_earned += job.budget;
            env.storage().persistent().set(
                &DataKey::FreelancerStats(job.freelancer.clone()),
                &stats,
            );
        }

        env.events()
            .publish((Symbol::new(&env, "ms_apprvd"),), (job_id, index, ms.amount));
    }

    pub fn cancel_job(env: Env, client: Address, job_id: u64) {
        client.require_auth();
        let mut job: Job = env.storage().persistent().get(&DataKey::Job(job_id)).unwrap();
        assert!(job.client == client, "not your job");
        assert!(
            job.status == JobStatus::Open || job.status == JobStatus::InProgress,
            "cannot cancel"
        );
        job.status = JobStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Job(job_id), &job);

        env.events()
            .publish((Symbol::new(&env, "j_cancel"),), (job_id, client));
    }

    pub fn complete_job(env: Env, client: Address, job_id: u64) {
        client.require_auth();
        let mut job: Job = env.storage().persistent().get(&DataKey::Job(job_id)).unwrap();
        assert!(job.client == client, "not your job");
        job.status = JobStatus::Completed;
        env.storage().persistent().set(&DataKey::Job(job_id), &job);

        let mut stats: FreelancerStats = env
            .storage()
            .persistent()
            .get(&DataKey::FreelancerStats(job.freelancer.clone()))
            .unwrap_or(FreelancerStats {
                completed_jobs: 0,
                total_earned: 0,
                rating_sum: 0,
                rating_count: 0,
            });
        stats.completed_jobs += 1;
        stats.total_earned += job.budget;
        env.storage().persistent().set(
            &DataKey::FreelancerStats(job.freelancer.clone()),
            &stats,
        );

        env.events()
            .publish((Symbol::new(&env, "j_done"),), (job_id, client));
    }

    pub fn leave_review(
        env: Env,
        reviewer: Address,
        reviewee: Address,
        job_id: u64,
        rating: u32,
        comment: String,
    ) {
        reviewer.require_auth();
        assert!(rating >= 1 && rating <= 5, "rating must be 1-5");

        let mut stats: FreelancerStats = env
            .storage()
            .persistent()
            .get(&DataKey::FreelancerStats(reviewee.clone()))
            .unwrap_or(FreelancerStats {
                completed_jobs: 0,
                total_earned: 0,
                rating_sum: 0,
                rating_count: 0,
            });
        stats.rating_sum += rating;
        stats.rating_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::FreelancerStats(reviewee.clone()), &stats);

        env.events().publish(
            (symbol_short!("review"),),
            (job_id, reviewer, reviewee, rating, comment),
        );
    }

    // Read-only
    pub fn get_config(env: Env) -> Config {
        env.storage().instance().get(&DataKey::Config).unwrap()
    }

    pub fn get_job(env: Env, job_id: u64) -> Job {
        env.storage().persistent().get(&DataKey::Job(job_id)).unwrap()
    }

    pub fn get_milestone(env: Env, job_id: u64, index: u32) -> Milestone {
        env.storage()
            .persistent()
            .get(&DataKey::Milestone(job_id, index))
            .unwrap()
    }

    pub fn get_freelancer_stats(env: Env, freelancer: Address) -> FreelancerStats {
        env.storage()
            .persistent()
            .get(&DataKey::FreelancerStats(freelancer))
            .unwrap_or(FreelancerStats {
                completed_jobs: 0,
                total_earned: 0,
                rating_sum: 0,
                rating_count: 0,
            })
    }

    pub fn get_job_applicants(env: Env, job_id: u64) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::JobApplications(job_id))
            .unwrap_or(Vec::new(&env))
    }
}

mod test;
