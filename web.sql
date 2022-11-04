--
-- PostgreSQL database dump
--

-- Dumped from database version 10.19
-- Dumped by pg_dump version 10.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: task_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_type AS ENUM (
    'NEW',
    'IN WORK',
    'COMPLETED'
);


ALTER TYPE public.task_type OWNER TO postgres;

--
-- Name: task_type_old; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_type_old AS ENUM (
    'NEW',
    'IN WORK',
    'COMPLETED',
    'DELETED'
);


ALTER TYPE public.task_type_old OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Groups" (
    id integer NOT NULL,
    name character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."Groups" OWNER TO postgres;

--
-- Name: Tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tasks" (
    id integer NOT NULL,
    taskname character varying NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "GroupId" integer,
    "deadlineAt" timestamp without time zone,
    status public.task_type DEFAULT ('NEW'::text)::public.task_type NOT NULL
);


ALTER TABLE public."Tasks" OWNER TO postgres;

--
-- Name: User_Groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User_Groups" (
    "UserId" integer NOT NULL,
    "GroupId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."User_Groups" OWNER TO postgres;

--
-- Name: User_Groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_Groups_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_Groups_id_seq" OWNER TO postgres;

--
-- Name: User_Groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_Groups_id_seq" OWNED BY public."User_Groups".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    username character varying NOT NULL,
    passwordhash text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.category_id_seq OWNER TO postgres;

--
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_id_seq OWNED BY public."Groups".id;


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public."Tasks".id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public."Users".id;


--
-- Name: Groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Groups" ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- Name: Tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tasks" ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: User_Groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_Groups" ALTER COLUMN id SET DEFAULT nextval('public."User_Groups_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: Groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Groups" (id, name, "createdAt", "updatedAt") FROM stdin;
1	Администратор	2022-10-27 13:07:25.339649	2022-10-27 13:07:25.366713
2	Тест	2022-10-27 13:07:25.339649	2022-10-27 13:07:25.366713
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tasks" (id, taskname, description, "createdAt", "updatedAt", "GroupId", "deadlineAt", status) FROM stdin;
1	Сделать 1 лабу по РИП	<p><em><strong>Проверка</strong></em></p>	2022-10-18 00:00:00	2022-11-04 12:41:43.302	1	2022-10-19 12:00:00	COMPLETED
2	Сделать 2 лабу по РИП		2022-10-23 00:00:00	2022-11-04 12:41:59.329	1	2022-10-24 12:00:00	COMPLETED
3	Сделать 3 лабу по РИП		2022-11-04 12:42:50.503	2022-11-04 12:43:12.438	1	2022-11-07 12:00:29	IN WORK
\.


--
-- Data for Name: User_Groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User_Groups" ("UserId", "GroupId", "createdAt", "updatedAt", id) FROM stdin;
1	2	2022-10-27 12:31:18.557912	2022-11-02 08:08:30.879	1
1	1	2022-11-02 08:27:58.932	2022-11-02 08:27:58.932	17
2	1	2022-11-04 18:28:02.635	2022-11-04 18:28:02.635	21
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, username, passwordhash, "createdAt", "updatedAt") FROM stdin;
2	scv	bdb57bee241dc7a25dc383bb4b78888dc84db1453ae7996fd915cab5dd56ce14	2022-10-27 11:41:48.905012	2022-10-27 11:41:48.905012
1	alesha	9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08	2022-10-27 11:41:48.905012	2022-11-04 18:02:15.734
\.


--
-- Name: User_Groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_Groups_id_seq"', 21, true);


--
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.category_id_seq', 2, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: User_Groups User_Groups_UserId_GroupId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_Groups"
    ADD CONSTRAINT "User_Groups_UserId_GroupId_key" UNIQUE ("UserId", "GroupId");


--
-- Name: Groups category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Groups"
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);


--
-- Name: Tasks tasks_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tasks"
    ADD CONSTRAINT tasks_pk PRIMARY KEY (id);


--
-- Name: User_Groups user_groups_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_Groups"
    ADD CONSTRAINT user_groups_pk PRIMARY KEY (id);


--
-- Name: Users users_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT users_pk PRIMARY KEY (id);


--
-- Name: tasks_assigned_group_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tasks_assigned_group_idx ON public."Tasks" USING btree ("GroupId", "deadlineAt");


--
-- Name: users_groups_id_group_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_id_group_idx ON public."User_Groups" USING btree ("GroupId");


--
-- Name: users_groups_id_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_id_user_idx ON public."User_Groups" USING btree ("UserId");


--
-- Name: User_Groups User_Groups_GroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_Groups"
    ADD CONSTRAINT "User_Groups_GroupId_fkey" FOREIGN KEY ("GroupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- Name: User_Groups User_Groups_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_Groups"
    ADD CONSTRAINT "User_Groups_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- Name: Tasks tasks_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tasks"
    ADD CONSTRAINT tasks_fk FOREIGN KEY ("GroupId") REFERENCES public."Groups"(id);


--
-- PostgreSQL database dump complete
--

