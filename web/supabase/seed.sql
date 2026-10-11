-- ============================================================================
-- Promise Fertility HMIS — DEMO SEED
-- FICTIONAL / synthetic data for demonstration and testing only.
-- Do NOT load into a production environment that holds real patient records.
-- Keeps: profiles (users), locations, templates, consent_forms.
-- Resets & repopulates all clinical / financial / operational tables.
-- Run in the Supabase SQL editor, or: psql "$DATABASE_URL" -f web/supabase/seed.sql
-- ============================================================================

-- Reset identifiers so MRNs / bill numbers restart cleanly
alter sequence mrn_seq restart 1001;
alter sequence couple_seq restart 1;
alter sequence bill_seq restart 1;
alter sequence receipt_seq restart 1;

truncate
  form_responses, visits, appointments, receipts, bill_items, bills, documents,
  counselling_notes, consents, pgd_samples, vitrified_items, vitrifications,
  embryos, fertilisations, semen_samples, outcomes, opu, stim_days, cycles,
  couples, patients, stock_movements, drugs, donors, storage_units
  restart identity cascade;

-- ---------------------------------------------------------------------------
-- Reference / inventory
-- ---------------------------------------------------------------------------
insert into storage_units(kind,label,colour,positions) values
 ('CANISTER','C-1','RED',8),('CANISTER','C-2','BLUE',8),
 ('GOBLET','G-1','GREEN',10),('GOBLET','G-2','YELLOW',10),
 ('HEXATUBE','H-1','PURPLE',6);

with d as (
 insert into drugs(name,generic_name,form,strength,unit) values
 ('Gonal-F','Follitropin alfa','Injection','75 IU','vials'),
 ('Menopur','Menotropin','Injection','75 IU','vials'),
 ('Cetrotide','Cetrorelix','Injection','0.25 mg','vials'),
 ('Ovitrelle','Choriogonadotropin alfa','Injection','250 mcg','pens'),
 ('Crinone','Progesterone gel','Gel','8%','tubes'),
 ('Lupride','Leuprorelin','Injection','1 mg','vials')
 returning id)
insert into stock_movements(drug_id,kind,qty) select id,'opening',100 from d;

insert into donors(kind,code,details) values
 ('ovum','OD-001','{"blood_group":"O+","age":"26"}'),
 ('ovum','OD-002','{"blood_group":"A+","age":"24"}'),
 ('semen','SD-001','{"blood_group":"B+","age":"30"}'),
 ('semen','SD-002','{"blood_group":"O+","age":"28"}');

-- ---------------------------------------------------------------------------
-- Couples, cycles and the full clinical + financial trail
-- ---------------------------------------------------------------------------
do $$
declare
  fnames text[] := array['Ananya','Priya','Divya','Meena','Kavya','Lakshmi','Sneha','Pooja','Radha','Nisha','Aarthi','Deepa','Shruti','Geeta','Rekha','Swathi'];
  lnames text[] := array['Sharma','Reddy','Iyer','Nair','Patel','Gupta','Rao','Menon','Verma','Krishnan','Pillai','Das','Shetty','Bose'];
  mnames text[] := array['Arjun','Rahul','Vikram','Karthik','Rohan','Sanjay','Aditya','Vivek','Nikhil','Manoj','Ravi','Suresh','Anand','Kiran'];
  treatments text[] := array['IVF (ICSI)','IVF (Conventional)','IUI','IVF (ICSI)','FET','IUI'];
  f uuid; m uuid; c uuid; cy uuid; fert uuid; billid uuid; vitid uuid;
  i int; cycno int; ao int; verdict int; vcount int;
  sd date; tr text; st text;
begin
  for i in 1..15 loop
    insert into patients(full_name,gender,dob,phone,allergies,referred_by)
      values (fnames[1+(i % array_length(fnames,1))]||' '||lnames[1+(i % array_length(lnames,1))],'Female',
        make_date(1988+(i%8),1+(i%12),1+(i%27)),'98'||lpad((10000000+i*137)::text,8,'0'),
        case when i%4=0 then 'Penicillin' else null end,
        case when i%3=0 then 'Dr Referral' else 'Self' end)
      returning id into f;
    insert into patients(full_name,gender,dob,phone)
      values (mnames[1+(i % array_length(mnames,1))]||' '||lnames[1+(i % array_length(lnames,1))],'Male',
        make_date(1985+(i%8),1+((i+3)%12),1+((i+5)%27)),'99'||lpad((10000000+i*219)::text,8,'0'))
      returning id into m;
    insert into couples(female_id,male_id,referred_by) values (f,m,'Self') returning id into c;

    for cycno in 1..(1+(i%2)) loop
      tr := treatments[1+((i+cycno) % array_length(treatments,1))];
      sd := current_date - (((i*18)+(cycno*30)) % 300);
      if (current_date - sd) > 90 then
        st := (array['Completed','Completed','Cancelled'])[1+(i%3)];
      else
        st := (array['Stimulation','OPU Done','Embryo Culture','Transfer Done','Pregnancy Test'])[1+(i%5)];
      end if;

      insert into cycles(couple_id,cycle_no,cycle_ref,start_date,treatment_type,protocol_name,status,ovum_source,sperm_source)
        values (c,cycno,'TRP/'||lpad(((i*10)+cycno)::text,5,'0')||'/'||to_char(sd,'YY'),sd,tr,
          (array['Antagonist','Long Agonist','Mild'])[1+(i%3)],st,
          case when i%7=0 then 'Donor Ovum' else 'Self Ovum (Fresh)' end,
          case when i%9=0 then 'Donor Sperm' else 'Partner Sperm' end)
        returning id into cy;

      if tr like 'IVF%' and st in ('Stimulation','OPU Done','Embryo Culture','Transfer Done','Pregnancy Test','Completed') then
        insert into stim_days(cycle_id,day_no,day_date,hmg_mg,rfsh_mg,antagonist_mg,right_follicles,left_follicles,endo_thickness_mm,e2,p4)
        select cy,g,sd+(g-1),150,150,case when g>=6 then 0.25 else null end,
          (array['10, 9','12, 11','14, 13, 12','16, 15, 14','18, 17, 16'])[least(5,ceil(g/2.0))::int],
          (array['9, 8','11, 10','13, 12','15, 14','17, 16'])[least(5,ceil(g/2.0))::int],
          round((5.5+g*0.6)::numeric,1),200*g,round((0.3+g*0.05)::numeric,2)
        from generate_series(1,8) g;
      end if;

      if tr like 'IVF%' and st in ('OPU Done','Embryo Culture','Transfer Done','Pregnancy Test','Completed') then
        ao := 8+(i%8);
        insert into opu(cycle_id,opu_at,consent_obtained,surgeon,primary_embryologist,mature_oocytes,immature_oocytes,metaphase_ii,fert_2pn,embryos_obtained)
          values (cy,sd+10,true,'Dr Keerthi','Emb. Harish',ao,1+(i%3),ao-(i%3),greatest(2,ao-3-(i%2)),greatest(1,ao-4-(i%3)));
        insert into fertilisations(cycle_id,fert_date,method,successful) values (cy,sd+10,'ICSI',true) returning id into fert;
        insert into embryos(fertilisation_id,oocyte_no,stage,status)
        select fert,g,'Day 5',
          case when g<=2 then 'transferred' when g<=3 then 'vitrified' when g=4 then 'culture' else 'discarded' end
        from generate_series(1,greatest(3,ao-4-(i%3))) g;

        select count(*) into vcount from embryos e join fertilisations fr on fr.id=e.fertilisation_id
          where fr.cycle_id=cy and e.status='vitrified';
        if vcount>0 then
          insert into vitrifications(cycle_id,kind,vit_date,done_by,item_count,renewal_due)
            values (cy,'embryo',sd+15,'Emb. Harish',vcount,(sd+15)+interval '1 year') returning id into vitid;
          insert into vitrified_items(vitrification_id,embryo_id,unit_id,position,grade)
          select vitid,e.id,(select id from storage_units where kind='GOBLET' order by label limit 1),
            row_number() over(), (array['AA','AB','BA','BB'])[1+(i%4)]
          from embryos e join fertilisations fr on fr.id=e.fertilisation_id
          where fr.cycle_id=cy and e.status='vitrified';
        end if;
      end if;

      if st in ('Transfer Done','Pregnancy Test','Completed') then
        verdict := i%3;
        insert into outcomes(cycle_id,transfer_date,pregnancy,beta_hcg_value,beta_hcg_date,clinical_pregnancy,clinical_pregnancy_date,sacs_seen,location)
          values (cy,sd+15,
            case verdict when 0 then true when 1 then false else null end,
            case verdict when 0 then 300+i*20 when 1 then 2 else null end, sd+27,
            case verdict when 0 then true when 1 then false else null end,
            case when verdict=0 then sd+40 else null end,
            case when verdict=0 then 1 else null end,
            case when verdict=0 then 'Intrauterine' else null end);
      elsif tr like 'IUI%' and (current_date - sd) > 60 then
        insert into outcomes(cycle_id,pregnancy,clinical_pregnancy) values (cy,false,false);
      end if;

      -- Bill (draft -> issue -> receipt), so the bill-total / integrity triggers run naturally
      insert into bills(patient_id,cycle_id,kind) values (f,cy,case when tr like 'IVF%' then 'Procedure' else 'Consultation' end)
        returning id into billid;
      insert into bill_items(bill_id,description,qty,rate)
        values (billid, tr||' package', 1, case when tr like 'IVF%' then 165000+(i%4)*15000 else 18000 end);
      update bills set status='issued' where id=billid;
      insert into receipts(bill_id,amount,mode)
        values (billid,
          (select case when i%3=0 then round(total*0.5,2) else total end from bills where id=billid),
          (array['Cash','Card','UPI'])[1+(i%3)]);
    end loop;

    if i%2=0 then
      insert into counselling_notes(couple_id,done_by,note,status)
        values (c,'Dr Keerthi','Initial infertility counselling completed; treatment options discussed with the couple.','Consent received');
    end if;
  end loop;

  -- A little "today" activity for the dashboard
  insert into visits(patient_id,visit_type,reason,diagnosis)
    select id,'Consultation','Follow-up','Under evaluation' from patients order by created_at limit 4;
  insert into appointments(patient_id,doctor_name,starts_at,reason)
    select id,'Dr Keerthi', now()+(row_number() over())*interval '30 min','Follicular scan'
    from patients order by created_at limit 5;
end $$;
