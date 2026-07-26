#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, Address, FreelanceMarketplaceClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(FreelanceMarketplace, ());
    let client = FreelanceMarketplaceClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, admin, client)
}

#[test]
fn test_initialize() {
    let (env, admin, client) = setup();
    let config = client.get_config();
    assert_eq!(config.admin, admin);
    assert_eq!(config.job_counter, 0);
}

#[test]
fn test_create_job() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Build a website"),
        &String::from_str(&env, "Need a responsive website"),
        &1000_0000000,
    );
    assert_eq!(job_id, 1);
    let job = client.get_job(&1);
    assert_eq!(job.client, client_addr);
    assert_eq!(job.budget, 1000_0000000);
    assert_eq!(job.status, JobStatus::Open);
}

#[test]
fn test_create_job_and_assign() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Design logo"),
        &String::from_str(&env, "Modern logo needed"),
        &500_0000000,
    );

    client.apply_for_job(&freelancer, &job_id);
    client.assign_freelancer(&client_addr, &job_id, &freelancer);

    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::InProgress);
    assert_eq!(job.freelancer, freelancer);
}

#[test]
fn test_submit_and_approve_milestone() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Mobile app"),
        &String::from_str(&env, "React Native app"),
        &2000_0000000,
    );

    client.apply_for_job(&freelancer, &job_id);
    client.assign_freelancer(&client_addr, &job_id, &freelancer);
    client.add_milestone(
        &client_addr,
        &job_id,
        &String::from_str(&env, "UI Design"),
        &500_0000000,
    );

    client.submit_milestone(
        &freelancer,
        &job_id,
        &0,
        &String::from_str(&env, "https://figma.com/design"),
    );
    client.approve_milestone(&client_addr, &job_id, &0);

    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Completed);
}

#[test]
fn test_leave_review() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "API development"),
        &String::from_str(&env, "REST API"),
        &800_0000000,
    );

    client.apply_for_job(&freelancer, &job_id);
    client.assign_freelancer(&client_addr, &job_id, &freelancer);
    client.complete_job(&client_addr, &job_id);

    client.leave_review(
        &client_addr,
        &freelancer,
        &job_id,
        &5,
        &String::from_str(&env, "Great work!"),
    );

    let stats = client.get_freelancer_stats(&freelancer);
    assert_eq!(stats.rating_sum, 5);
    assert_eq!(stats.rating_count, 1);
    assert_eq!(stats.completed_jobs, 1);
}

#[test]
fn test_cancel_job() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Test job"),
        &String::from_str(&env, "Description"),
        &100_0000000,
    );

    client.cancel_job(&client_addr, &job_id);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Cancelled);
}

#[test]
fn test_add_multiple_milestones() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Web app"),
        &String::from_str(&env, "Full stack"),
        &3000_0000000,
    );

    client.apply_for_job(&freelancer, &job_id);
    client.assign_freelancer(&client_addr, &job_id, &freelancer);

    client.add_milestone(
        &client_addr,
        &job_id,
        &String::from_str(&env, "Phase 1"),
        &1000_0000000,
    );
    client.add_milestone(
        &client_addr,
        &job_id,
        &String::from_str(&env, "Phase 2"),
        &1000_0000000,
    );
    client.add_milestone(
        &client_addr,
        &job_id,
        &String::from_str(&env, "Phase 3"),
        &1000_0000000,
    );

    let job = client.get_job(&job_id);
    assert_eq!(job.milestone_count, 3);

    let ms0 = client.get_milestone(&job_id, &0);
    assert_eq!(ms0.title, String::from_str(&env, "Phase 1"));

    let ms2 = client.get_milestone(&job_id, &2);
    assert_eq!(ms2.amount, 1000_0000000);
}

#[test]
fn test_job_applicants() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let freelancer1 = Address::generate(&env);
    let freelancer2 = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Logo design"),
        &String::from_str(&env, "Need logo"),
        &200_0000000,
    );

    client.apply_for_job(&freelancer1, &job_id);
    client.apply_for_job(&freelancer2, &job_id);

    let applicants = client.get_job_applicants(&job_id);
    assert_eq!(applicants.len(), 2);
    assert!(applicants.contains(freelancer1));
    assert!(applicants.contains(freelancer2));
}

#[test]
fn test_freelancer_stats_default() {
    let (env, _, client) = setup();
    let freelancer = Address::generate(&env);
    let stats = client.get_freelancer_stats(&freelancer);
    assert_eq!(stats.completed_jobs, 0);
    assert_eq!(stats.total_earned, 0);
    assert_eq!(stats.rating_sum, 0);
    assert_eq!(stats.rating_count, 0);
}

#[test]
fn test_multiple_reviews() {
    let (env, _, client) = setup();
    let freelancer = Address::generate(&env);
    let reviewer1 = Address::generate(&env);
    let reviewer2 = Address::generate(&env);

    client.leave_review(
        &reviewer1,
        &freelancer,
        &1,
        &5,
        &String::from_str(&env, "Excellent!"),
    );
    client.leave_review(
        &reviewer2,
        &freelancer,
        &2,
        &4,
        &String::from_str(&env, "Good job"),
    );

    let stats = client.get_freelancer_stats(&freelancer);
    assert_eq!(stats.rating_sum, 9);
    assert_eq!(stats.rating_count, 2);
}

#[test]
#[should_panic(expected = "job not open")]
fn test_assign_to_non_open_job() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100_0000000,
    );

    client.cancel_job(&client_addr, &job_id);
    client.assign_freelancer(&client_addr, &job_id, &freelancer);
}

#[test]
#[should_panic(expected = "not your job")]
fn test_wrong_client_assign() {
    let (env, _, client) = setup();
    let client_addr = Address::generate(&env);
    let wrong_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100_0000000,
    );

    client.apply_for_job(&freelancer, &job_id);
    client.assign_freelancer(&wrong_client, &job_id, &freelancer);
}
