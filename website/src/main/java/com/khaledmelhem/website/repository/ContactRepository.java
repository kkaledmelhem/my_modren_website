package com.khaledmelhem.website.repository;

import com.khaledmelhem.website.model.ContactSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactRepository extends JpaRepository<ContactSubmission, Long> {
}
