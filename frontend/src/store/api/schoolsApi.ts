import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { District, School, LoginPayload } from "@/types";

export const schoolsApi = createApi({
	reducerPath: "schoolsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API || ""}/api`,
	}),
	tagTypes: ["Districts", "Schools", "Data"],
	endpoints: (builder) => ({
		getDistricts: builder.query<District[], void>({
			query: () => "/districts",
			providesTags: ["Districts"],
		}),

		getSchoolsByDistrict: builder.query<School[], number>({
			query: (districtId) => `/districts/${districtId}/schools`,
			providesTags: (_res, _err, id) => [{ type: "Schools", id }],
		}),

		login: builder.mutation<{ status: string }, LoginPayload>({
			query: (body) => ({ url: "/admin/login", method: "POST", body }),
		}),

		logout: builder.mutation<{ status: string }, void>({
			query: () => ({ url: "/admin/logout", method: "POST" }),
		}),

		checkDataExists: builder.query<{ exists: boolean }, void>({
			query: () => "/admin/data/exists",
			providesTags: ["Data"],
		}),

		uploadData: builder.mutation<{ status: string }, FormData>({
			query: (formData) => ({
				url: "/admin/data/upload",
				method: "POST",
				body: formData,
			}),
			invalidatesTags: ["Districts", "Schools", "Data"],
		}),
	}),
});

export const {
	useGetDistrictsQuery,
	useGetSchoolsByDistrictQuery,
	useLoginMutation,
	useLogoutMutation,
	useCheckDataExistsQuery,
	useUploadDataMutation,
} = schoolsApi;
